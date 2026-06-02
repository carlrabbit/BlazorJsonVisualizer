import {
  findNodeIdByPath,
  listChildNodeIds,
  parseJsonDocument,
  type DocumentSessionRecord,
  type RuntimePatchDto,
  type StructuralIndexDocument,
  type StructuralNodeRecord,
  RUNTIME_PROTOCOL_VERSION,
  SessionRegistry,
  toggleFoldInDocument,
  parseTheme,
  exportTheme
} from "./index.js";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertThrows(action: () => void, message: string): void {
  let threw = false;

  try {
    action();
  } catch {
    threw = true;
  }

  assert(threw, message);
}

function requireDocument(document: StructuralIndexDocument | undefined): StructuralIndexDocument {
  if (document === undefined) {
    throw new Error("document should be defined");
  }

  return document;
}

function requireNode(
  document: StructuralIndexDocument,
  nodeId: string | undefined,
  message: string
): StructuralNodeRecord {
  if (nodeId === undefined) {
    throw new Error(message);
  }

  const node = document.nodesById[nodeId];
  if (node === undefined) {
    throw new Error(message);
  }

  return node;
}

function requireSession(session: DocumentSessionRecord | undefined): DocumentSessionRecord {
  if (session === undefined) {
    throw new Error("session should be defined");
  }

  return session;
}

function expectAccepted(
  result:
    | ReturnType<SessionRegistry["applyTransaction"]>
    | ReturnType<SessionRegistry["undo"]>
    | ReturnType<SessionRegistry["redo"]>
): {
  patch: RuntimePatchDto;
  session: DocumentSessionRecord;
} {
  if (!result.accepted) {
    throw new Error(`transaction should be accepted: ${result.reason}`);
  }

  return {
    patch: result.patch,
    session: result.session
  };
}

function parserBuildsStructuralIndexForObjectDocument(): void {
  const result = parseJsonDocument('{"name":"Widget","active":true}');
  assert(result.document !== undefined, "object document should parse");

  const document = requireDocument(result.document);
  const rootNode = requireNode(document, document.rootNodeId, "root node should exist");
  const propertyNodeIds = listChildNodeIds(document, document.rootNodeId);
  const nameProperty = requireNode(document, propertyNodeIds[0], "first property should exist");
  const activeProperty = requireNode(document, propertyNodeIds[1], "second property should exist");
  const nameValue = requireNode(document, nameProperty.firstChildId, "name value should exist");
  const activeValue = requireNode(document, activeProperty.firstChildId, "active value should exist");

  assert(rootNode.kind === "object", "root node should be an object");
  assert(rootNode.foldable, "object nodes should be foldable");
  assert(propertyNodeIds.length === 2, "object should expose property nodes as children");
  assert(nameProperty.kind === "property", "first child should be a property node");
  assert(nameProperty.path === "$.name", "property path should include the object member name");
  assert(nameValue.kind === "string", "property value should be a string node");
  assert(nameValue.scalarValue === "Widget", "string node should carry decoded scalar value");
  assert(activeValue.kind === "boolean", "second property value should be a boolean node");
  assert(activeValue.scalarValue === true, "boolean value should be preserved");
}

function parserBuildsStructuralIndexForArrayDocument(): void {
  const result = parseJsonDocument("[1,false,null]");
  assert(result.document !== undefined, "array document should parse");

  const document = requireDocument(result.document);
  const rootNode = requireNode(document, document.rootNodeId, "root node should exist");
  const itemNodeIds = listChildNodeIds(document, document.rootNodeId);

  assert(rootNode.kind === "array", "root node should be an array");
  assert(itemNodeIds.length === 3, "array should expose item nodes as children");
  assert(
    requireNode(document, itemNodeIds[0], "first item should exist").kind === "number",
    "first item should be a number node"
  );
  assert(
    requireNode(document, itemNodeIds[1], "second item should exist").kind === "boolean",
    "second item should be a boolean node"
  );
  assert(
    requireNode(document, itemNodeIds[2], "third item should exist").kind === "null",
    "third item should be a null node"
  );
  assert(
    requireNode(document, itemNodeIds[2], "third item should exist").path === "$[2]",
    "array item path should include the array index"
  );
}

function parserBuildsStructuralIndexForNestedDocument(): void {
  const result = parseJsonDocument('{"items":[{"name":"alpha"}]}');
  assert(result.document !== undefined, "nested document should parse");

  const document = requireDocument(result.document);
  const itemsNodeId = findNodeIdByPath(document, "$.items");
  const firstItemNodeId = findNodeIdByPath(document, "$.items[0]");
  const nameNodeId = findNodeIdByPath(document, "$.items[0].name");

  assert(itemsNodeId !== undefined, "array path should resolve to a structural node");
  assert(firstItemNodeId !== undefined, "nested object path should resolve to a structural node");
  assert(nameNodeId !== undefined, "nested string path should resolve to a structural node");
  assert(
    requireNode(document, itemsNodeId, "items node should exist").kind === "array",
    "items path should point to an array node"
  );
  assert(
    requireNode(document, firstItemNodeId, "first item node should exist").kind === "object",
    "array item should be an object node"
  );
  assert(
    requireNode(document, nameNodeId, "name node should exist").kind === "string",
    "nested value should be a string node"
  );
  assert(
    requireNode(document, firstItemNodeId, "first item node should exist").parentId !== undefined,
    "nested object should track its structural parent"
  );
}

function invalidJsonProducesDeterministicDiagnostic(): void {
  const result = parseJsonDocument('{"items": ]');
  assert(result.document === undefined, "invalid JSON should not produce a structural index");
  assert(result.diagnostics.length === 1, "invalid JSON should produce one diagnostic");
  const diagnostic = result.diagnostics[0];
  if (diagnostic === undefined) {
    throw new Error("diagnostic should exist");
  }

  assert(diagnostic.message === "Expected a JSON value.", "diagnostic message should be deterministic");
  assert(diagnostic.severity === "error", "diagnostic severity should be error");
}

function foldStateCanBeToggledForObjectAndArrayNodes(): void {
  const result = parseJsonDocument('{"items":[{"name":"alpha"}]}');
  assert(result.document !== undefined, "document should parse before fold toggles");

  const document = requireDocument(result.document);
  const rootObjectId = document.rootNodeId;
  const arrayNodeId = findNodeIdByPath(document, "$.items");
  assert(arrayNodeId !== undefined, "array node should be discoverable by path");
  const resolvedArrayNodeId = arrayNodeId ?? "";

  const rootFolded = toggleFoldInDocument(document, rootObjectId);
  const arrayFolded = toggleFoldInDocument(rootFolded, resolvedArrayNodeId);

  assert(
    requireNode(rootFolded, rootObjectId, "root object should exist").folded,
    "root object fold state should toggle on"
  );
  assert(
    requireNode(arrayFolded, resolvedArrayNodeId, "array node should exist").folded,
    "array fold state should toggle on"
  );
}

function revealPathExpandsFoldedAncestors(): void {
  const registry = new SessionRegistry();
  registry.createSession({ hostElementId: "host-1", sessionId: "session-1" });
  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text: '{"items":[{"name":"alpha"}]}'
  });

  const initialSession = requireSession(registry.getSession("session-1"));
  const initialDocument = requireDocument(initialSession.document);

  const rootObjectId = initialDocument.rootNodeId;
  const arrayNodeId = findNodeIdByPath(initialDocument, "$.items");
  assert(arrayNodeId !== undefined, "array node should be discoverable before folding");
  const resolvedArrayNodeId = arrayNodeId ?? "";

  registry.toggleFold({ nodeId: rootObjectId, sessionId: "session-1" });
  registry.toggleFold({ nodeId: resolvedArrayNodeId, sessionId: "session-1" });
  const foldedSession = requireSession(registry.getSession("session-1"));
  const foldedDocument = requireDocument(foldedSession.document);
  assert(
    requireNode(foldedDocument, rootObjectId, "root object should exist").folded === true,
    "root object should be folded before reveal"
  );
  assert(
    requireNode(foldedDocument, resolvedArrayNodeId, "array node should exist").folded === true,
    "array should be folded before reveal"
  );

  registry.revealPath({ path: "$.items[0].name", sessionId: "session-1" });
  const revealedSession = requireSession(registry.getSession("session-1"));
  const revealedDocument = requireDocument(revealedSession.document);
  assert(
    requireNode(revealedDocument, rootObjectId, "root object should exist").folded === false,
    "root object should be expanded by revealPath"
  );
  assert(
    requireNode(revealedDocument, resolvedArrayNodeId, "array node should exist").folded === false,
    "array should be expanded by revealPath"
  );
  assert(
    revealedSession.revealTargetNodeId === findNodeIdByPath(revealedDocument, "$.items[0].name"),
    "revealPath should record the target node"
  );
}

function replacePrimitiveValueSupportsUndoRedoAndPatchRevisions(): void {
  const registry = createLoadedSession('{"milestone":3,"active":true}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);
  const milestoneNodeId = findNodeIdByPath(initialDocument, "$.milestone");
  assert(milestoneNodeId !== undefined, "milestone node should exist");

  const applyResult = expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-1",
        sessionId,
        baseRevision: 0,
        kind: "replaceValue",
        payload: {
          nodeId: milestoneNodeId ?? "",
          value: 4
        }
      }
    })
  );

  assert(applyResult.patch.baseRevision === 0, "patch should record the base revision");
  assert(applyResult.patch.newRevision === 1, "patch should record the new revision");
  assert(applyResult.patch.operations[0]?.path === "$.milestone", "patch should identify the updated path");
  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$.milestone"), "milestone node should exist")
      .scalarValue === 4,
    "replaceValue should update the primitive"
  );

  const undoResult = expectAccepted(registry.undo({ sessionId }));
  assert(undoResult.patch.baseRevision === 1, "undo should use the previous revision as its base revision");
  assert(undoResult.patch.newRevision === 2, "undo should increment the revision");
  const undoneDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(
      undoneDocument,
      findNodeIdByPath(undoneDocument, "$.milestone"),
      "milestone node should exist after undo"
    ).scalarValue === 3,
    "undo should restore the previous primitive value"
  );

  const redoResult = expectAccepted(registry.redo({ sessionId }));
  assert(redoResult.patch.baseRevision === 2, "redo should use the latest revision as its base revision");
  assert(redoResult.patch.newRevision === 3, "redo should increment the revision");
  const redoneDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(
      redoneDocument,
      findNodeIdByPath(redoneDocument, "$.milestone"),
      "milestone node should exist after redo"
    ).scalarValue === 4,
    "redo should restore the replaced primitive value"
  );
}

function setPropertyValueAddsObjectProperty(): void {
  const registry = createLoadedSession('{"name":"Widget"}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  const result = expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-add-property",
        sessionId,
        baseRevision: initialSession.revision,
        kind: "setPropertyValue",
        payload: {
          objectNodeId: initialDocument.rootNodeId,
          propertyName: "active",
          value: true
        }
      }
    })
  );

  assert(result.patch.operations[0]?.path === "$.active", "setPropertyValue should emit the added property path");
  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$.active"), "active node should exist")
      .scalarValue === true,
    "setPropertyValue should add the property"
  );
}

function setPropertyValueReplacesExistingObjectPropertyValue(): void {
  const registry = createLoadedSession('{"name":"Widget"}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-replace-property",
        sessionId,
        baseRevision: initialSession.revision,
        kind: "setPropertyValue",
        payload: {
          objectNodeId: initialDocument.rootNodeId,
          propertyName: "name",
          value: "Gadget"
        }
      }
    })
  );

  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$.name"), "name node should exist").scalarValue ===
      "Gadget",
    "setPropertyValue should replace an existing object property"
  );
}

function removePropertyRemovesObjectProperty(): void {
  const registry = createLoadedSession('{"name":"Widget","active":true}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-remove-property",
        sessionId,
        baseRevision: initialSession.revision,
        kind: "removeProperty",
        payload: {
          objectNodeId: initialDocument.rootNodeId,
          propertyName: "active"
        }
      }
    })
  );

  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    findNodeIdByPath(updatedDocument, "$.active") === undefined,
    "removeProperty should remove the requested property"
  );
}

function insertArrayItemInsertsArrayValue(): void {
  const registry = createLoadedSession("[1,3]");
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-insert-array-item",
        sessionId,
        baseRevision: initialSession.revision,
        kind: "insertArrayItem",
        payload: {
          arrayNodeId: initialDocument.rootNodeId,
          index: 1,
          value: 2
        }
      }
    })
  );

  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$[1]"), "inserted item should exist")
      .scalarValue === 2,
    "insertArrayItem should insert the requested value"
  );
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$[2]"), "shifted item should exist").scalarValue ===
      3,
    "insertArrayItem should shift later values"
  );
}

function removeArrayItemRemovesArrayValue(): void {
  const registry = createLoadedSession("[1,2,3]");
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-remove-array-item",
        sessionId,
        baseRevision: initialSession.revision,
        kind: "removeArrayItem",
        payload: {
          arrayNodeId: initialDocument.rootNodeId,
          index: 1
        }
      }
    })
  );

  const updatedDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  assert(
    requireNode(updatedDocument, findNodeIdByPath(updatedDocument, "$[1]"), "shifted item should exist").scalarValue ===
      3,
    "removeArrayItem should shift later values"
  );
  assert(findNodeIdByPath(updatedDocument, "$[2]") === undefined, "removeArrayItem should shorten the array");
}

function staleBaseRevisionIsRejectedDeterministically(): void {
  const registry = createLoadedSession('{"milestone":3}');
  const sessionId = "session-1";
  const initialDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);
  const milestoneNodeId = findNodeIdByPath(initialDocument, "$.milestone");
  assert(milestoneNodeId !== undefined, "milestone node should exist");

  const result = registry.applyTransaction({
    sessionId,
    transaction: {
      transactionId: "tx-stale",
      sessionId,
      baseRevision: 1,
      kind: "replaceValue",
      payload: {
        nodeId: milestoneNodeId ?? "",
        value: 4
      }
    }
  });

  assert(result.accepted === false, "stale revisions should be rejected");
  if (result.accepted) {
    throw new Error("stale revision transaction should be rejected");
  }

  assert(
    result.reason === "Transaction base revision 1 does not match current revision 0.",
    "stale revision rejection should be deterministic"
  );
}

function invalidTargetNodeKindIsRejectedDeterministically(): void {
  const registry = createLoadedSession('{"milestone":3}');
  const sessionId = "session-1";
  const initialDocument = requireDocument(requireSession(registry.getSession(sessionId)).document);

  const result = registry.applyTransaction({
    sessionId,
    transaction: {
      transactionId: "tx-invalid-target",
      sessionId,
      baseRevision: 0,
      kind: "replaceValue",
      payload: {
        nodeId: initialDocument.rootNodeId,
        value: 4
      }
    }
  });

  assert(result.accepted === false, "invalid node kinds should be rejected");
  if (result.accepted) {
    throw new Error("invalid target transaction should be rejected");
  }

  assert(
    result.reason === "Target node 'node-1' must be a primitive value node, but was 'object'.",
    "invalid target rejection should be deterministic"
  );
}

function unsupportedUndoIsExplicit(): void {
  const registry = createLoadedSession('{"name":"Widget"}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-unsupported-undo",
        sessionId,
        baseRevision: 0,
        kind: "setPropertyValue",
        payload: {
          objectNodeId: initialDocument.rootNodeId,
          propertyName: "name",
          value: "Gadget"
        }
      }
    })
  );

  const result = registry.undo({ sessionId });
  assert(result.accepted === false, "unsupported undo should be rejected explicitly");
  if (result.accepted) {
    throw new Error("unsupported undo should be rejected");
  }

  assert(
    result.reason === "Undo is only supported for replaceValue transactions in Milestone 004.",
    "unsupported undo reason should be explicit"
  );
}

function resolvesPropertySchemaMetadata(): void {
  const registry = createLoadedSession('{"project":"BlazorJsonVisualizer"}');
  const sessionId = "session-1";

  registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      properties: {
        project: {
          type: "string",
          title: "Project",
          description: "Project display name"
        }
      },
      required: ["project"]
    }
  });

  const metadata = registry.getSchemaMetadataForPath({
    sessionId,
    path: "$.project"
  });

  assert(metadata !== undefined, "property schema metadata should resolve");
  assert(metadata?.title === "Project", "property metadata should include title");
  assert(metadata?.required === true, "required metadata should be propagated");
}

function resolvesArrayItemSchemaMetadata(): void {
  const registry = createLoadedSession('{"items":[{"status":"todo"}]}');
  const sessionId = "session-1";

  registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["todo", "done"]
              }
            }
          }
        }
      }
    }
  });

  const metadata = registry.getSchemaMetadataForPath({
    sessionId,
    path: "$.items[0].status"
  });

  assert(metadata !== undefined, "array item schema metadata should resolve");
  assert(Array.isArray(metadata?.enumValues), "enum metadata should include enum values");
  assert(
    metadata?.schemaPath === "#/properties/items/items/properties/status",
    "schema path should track array item traversal"
  );
}

function missingRequiredPropertyProducesSchemaDiagnostic(): void {
  const registry = createLoadedSession('{"project":"BlazorJsonVisualizer"}');
  const sessionId = "session-1";

  const result = registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      required: ["project", "items"],
      properties: {
        project: {
          type: "string"
        },
        items: {
          type: "array"
        }
      }
    }
  });

  assert(
    result.diagnostics.some((diagnostic) => diagnostic.message === "Missing required property 'items'."),
    "missing required property should produce a schema diagnostic"
  );
}

function primitiveTypeMismatchProducesSchemaDiagnostic(): void {
  const registry = createLoadedSession('{"score":"12"}');
  const sessionId = "session-1";

  const result = registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      properties: {
        score: {
          type: "number"
        }
      }
    }
  });

  assert(
    result.diagnostics.some(
      (diagnostic) => diagnostic.path === "$.score" && diagnostic.message.includes("Expected type")
    ),
    "primitive type mismatch should produce a schema diagnostic"
  );
}

function enumMismatchProducesSchemaDiagnostic(): void {
  const registry = createLoadedSession('{"status":"blocked"}');
  const sessionId = "session-1";

  const result = registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["todo", "done"]
        }
      }
    }
  });

  assert(
    result.diagnostics.some(
      (diagnostic) => diagnostic.path === "$.status" && diagnostic.message === "Value is not in the allowed enum set."
    ),
    "enum mismatch should produce a schema diagnostic"
  );
}

function schemaOverlayIsInvalidatedAfterTransaction(): void {
  const registry = createLoadedSession('{"milestone":3}');
  const sessionId = "session-1";
  const initialSession = requireSession(registry.getSession(sessionId));
  const initialDocument = requireDocument(initialSession.document);

  registry.attachSchema({
    sessionId,
    schemaId: "schema-1",
    schema: {
      type: "object",
      properties: {
        milestone: {
          type: "number"
        }
      }
    }
  });

  const milestoneNodeId = findNodeIdByPath(initialDocument, "$.milestone");
  assert(milestoneNodeId !== undefined, "milestone node should exist");

  const applyResult = registry.applyTransaction({
    sessionId,
    transaction: {
      transactionId: "tx-schema-invalidate",
      sessionId,
      baseRevision: 0,
      kind: "replaceValue",
      payload: {
        nodeId: milestoneNodeId ?? "",
        value: 4
      }
    }
  });

  assert(applyResult.accepted, "transaction should be accepted");
  const updatedSession = requireSession(registry.getSession(sessionId));
  assert(updatedSession.schemaAttachment === undefined, "schema attachment should be invalidated after transaction");
  assert(
    Object.keys(updatedSession.schemaMetadataByNodeId).length === 0,
    "schema metadata should be cleared after transaction"
  );
  assert(updatedSession.schemaDiagnostics.length === 0, "schema diagnostics should be cleared after transaction");
}

function createProjectionAcceptsArrayOfObjectsSource(): void {
  const registry = createLoadedSession('[{"name":"Alice","age":30},{"name":"Bob","active":true}]');
  const sessionId = "session-1";

  const result = registry.createProjection({
    sessionId,
    projectionId: "projection-1",
    kind: "table.arrayOfObjects",
    sourcePath: "$"
  });

  assert(result.projection.kind === "table.arrayOfObjects", "projection kind should be persisted");
  const tableProjection = requireSession(registry.getSession(sessionId)).tableProjectionsById["projection-1"];
  assert(tableProjection !== undefined, "table projection should be stored in the session");
  assert(
    tableProjection?.columns.map((column) => column.propertyName).join(",") === "name,age,active",
    "columns should be derived from observed object properties"
  );
}

function createProjectionRejectsUnsupportedSource(): void {
  const registry = createLoadedSession('{"items":[1,2,3]}');

  assertThrows(
    () =>
      registry.createProjection({
        sessionId: "session-1",
        projectionId: "projection-1",
        kind: "table.arrayOfObjects",
        sourcePath: "$.items"
      }),
    "projection source should reject non-object array items"
  );
}

function tableProjectionMapsRowsAndCellsToNodesAndPaths(): void {
  const registry = createLoadedSession('{"items":[{"name":"Alice","age":30},{"name":"Bob"}]}');
  const sessionId = "session-1";
  const result = registry.createProjection({
    sessionId,
    projectionId: "projection-1",
    kind: "table.arrayOfObjects",
    sourcePath: "$.items"
  });

  const tableProjection = requireSession(result.session).tableProjectionsById["projection-1"];
  if (tableProjection === undefined) {
    throw new Error("table projection should exist");
  }

  assert(tableProjection.rows.length === 2, "table projection should expose one row per array item");
  const firstRow = tableProjection.rows[0];
  if (firstRow === undefined) {
    throw new Error("first row should exist");
  }

  assert(firstRow.itemNodeId.length > 0, "row should map to the source object node id");
  const firstNameCell = firstRow.cells.find((cell) => cell.propertyName === "name");
  if (firstNameCell === undefined) {
    throw new Error("name cell should exist");
  }

  assert(firstNameCell.valueNodeId !== undefined, "existing property should map to a value node id");
  assert(firstNameCell.value === "Alice", "cell value should resolve from source JSON");

  const secondRow = tableProjection.rows[1];
  if (secondRow === undefined) {
    throw new Error("second row should exist");
  }

  const secondAgeCell = secondRow.cells.find((cell) => cell.propertyName === "age");
  if (secondAgeCell === undefined) {
    throw new Error("age cell should exist");
  }

  assert(secondAgeCell.valueNodeId === undefined, "missing properties should not have a value node id");
  assert(secondAgeCell.value === undefined, "missing properties should expose undefined cell values");
}

function projectionCellEditProducesSetPropertyValueTransaction(): void {
  const registry = createLoadedSession('{"items":[{"name":"Alice"}]}');
  const sessionId = "session-1";
  registry.createProjection({
    sessionId,
    projectionId: "projection-1",
    kind: "table.arrayOfObjects",
    sourcePath: "$.items"
  });

  const editResult = registry.editProjectionCell({
    sessionId,
    projectionId: "projection-1",
    rowId: "row-0",
    columnId: "column-0",
    value: "Alicia"
  });

  const accepted = expectAccepted(editResult);
  assert(
    accepted.patch.operations[0]?.kind === "setPropertyValue",
    "cell edits should produce setPropertyValue patch operations"
  );
  assert(
    accepted.patch.operations[0]?.path === "$.items[0].name",
    "cell edits should target the selected property path"
  );
}

function projectionRebuildsAfterUnderlyingTransaction(): void {
  const registry = createLoadedSession('{"items":[{"name":"Alice"}]}');
  const sessionId = "session-1";
  registry.createProjection({
    sessionId,
    projectionId: "projection-1",
    kind: "table.arrayOfObjects",
    sourcePath: "$.items"
  });

  const initialProjection = requireSession(registry.getSession(sessionId)).tableProjectionsById["projection-1"];
  if (initialProjection === undefined) {
    throw new Error("initial projection should exist");
  }

  const rowNodeId = initialProjection.rows[0]?.itemNodeId;
  if (rowNodeId === undefined) {
    throw new Error("projection row should exist");
  }

  expectAccepted(
    registry.applyTransaction({
      sessionId,
      transaction: {
        transactionId: "tx-projection-refresh",
        sessionId,
        baseRevision: 0,
        kind: "setPropertyValue",
        payload: {
          objectNodeId: rowNodeId,
          propertyName: "status",
          value: "todo"
        }
      }
    })
  );

  const refreshedProjection = requireSession(registry.getSession(sessionId)).tableProjectionsById["projection-1"];
  if (refreshedProjection === undefined) {
    throw new Error("refreshed projection should exist");
  }

  assert(
    refreshedProjection.columns.some((column) => column.propertyName === "status"),
    "projection should rebuild columns after document transactions"
  );
  const statusCell = refreshedProjection.rows[0]?.cells.find((cell) => cell.propertyName === "status");
  assert(statusCell?.value === "todo", "rebuilt projection should expose the updated cell value");
}

function sessionRegistryTracksCreateAndDispose(): void {
  const registry = new SessionRegistry();
  const session = registry.createSession({
    hostElementId: "host-1",
    options: {
      placeholderText: "Placeholder runtime"
    },
    sessionId: "session-1"
  });

  assert(session.lifecycleState === "created", "session should start in the created state");
  assert(session.revision === 0, "new sessions should start at revision zero");
  assert(registry.listSessionIds().length === 1, "registry should contain a created session");

  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text: '{"hello":"world"}'
  });
  registry.disposeSession({ sessionId: "session-1" });

  assert(registry.getSession("session-1") === undefined, "disposed sessions should be removed from the registry");
  assertThrows(
    () => registry.setViewport({ height: 100, sessionId: "session-1", width: 120 }),
    "disposed sessions should reject further commands"
  );
}

function runtimeProtocolVersionIsExported(): void {
  assert(RUNTIME_PROTOCOL_VERSION.length > 0, "protocol version should be a non-empty string");
}

function createLoadedSession(text: string): SessionRegistry {
  const registry = new SessionRegistry();
  registry.createSession({ hostElementId: "host-1", sessionId: "session-1" });
  registry.mountSession("session-1");
  registry.loadTextDocument({
    contentType: "application/json",
    documentId: "document-1",
    sessionId: "session-1",
    text
  });
  return registry;
}

parserBuildsStructuralIndexForObjectDocument();
parserBuildsStructuralIndexForArrayDocument();
parserBuildsStructuralIndexForNestedDocument();
invalidJsonProducesDeterministicDiagnostic();
foldStateCanBeToggledForObjectAndArrayNodes();
revealPathExpandsFoldedAncestors();
replacePrimitiveValueSupportsUndoRedoAndPatchRevisions();
setPropertyValueAddsObjectProperty();
setPropertyValueReplacesExistingObjectPropertyValue();
removePropertyRemovesObjectProperty();
insertArrayItemInsertsArrayValue();
removeArrayItemRemovesArrayValue();
staleBaseRevisionIsRejectedDeterministically();
invalidTargetNodeKindIsRejectedDeterministically();
unsupportedUndoIsExplicit();
sessionRegistryTracksCreateAndDispose();
runtimeProtocolVersionIsExported();
resolvesPropertySchemaMetadata();
resolvesArrayItemSchemaMetadata();
missingRequiredPropertyProducesSchemaDiagnostic();
primitiveTypeMismatchProducesSchemaDiagnostic();
enumMismatchProducesSchemaDiagnostic();
schemaOverlayIsInvalidatedAfterTransaction();
createProjectionAcceptsArrayOfObjectsSource();
createProjectionRejectsUnsupportedSource();
tableProjectionMapsRowsAndCellsToNodesAndPaths();
projectionCellEditProducesSetPropertyValueTransaction();
projectionRebuildsAfterUnderlyingTransaction();

const VALID_DARK_THEME_JSON = JSON.stringify({
  schemaVersion: "1.0",
  id: "technical-calm-dark",
  name: "Technical Calm Dark",
  mode: "dark",
  tokens: {
    "color.canvas.background": "#0f1117",
    "color.text.primary": "#e6e8ee"
  },
  plugins: {}
});

function themeParserAcceptsValidDarkTheme(): void {
  const result = parseTheme(VALID_DARK_THEME_JSON);
  assert(result.valid, "valid dark theme should parse successfully");
  assert(result.theme !== undefined, "valid theme should have a theme document");
  assert(result.diagnostics.length === 0, "valid theme should have no diagnostics");
  assert(result.theme!.id === "technical-calm-dark", "theme id should match");
  assert(result.theme!.mode === "dark", "theme mode should be dark");
}

function themeParserRejectsMissingSchemaVersion(): void {
  const json = JSON.stringify({
    id: "test",
    name: "Test",
    mode: "dark",
    tokens: {}
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme missing schemaVersion should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "schemaVersion"),
    "should have schemaVersion diagnostic"
  );
}

function themeParserRejectsMissingId(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    name: "Test",
    mode: "dark",
    tokens: {}
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme missing id should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "id"),
    "should have id diagnostic"
  );
}

function themeParserRejectsMissingName(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    mode: "dark",
    tokens: {}
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme missing name should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "name"),
    "should have name diagnostic"
  );
}

function themeParserRejectsMissingTokens(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    name: "Test",
    mode: "dark"
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme missing tokens should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "tokens"),
    "should have tokens diagnostic"
  );
}

function themeParserRejectsUnsupportedMode(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    name: "Test",
    mode: "light",
    tokens: {}
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme with unsupported mode should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "mode"),
    "should have mode diagnostic"
  );
}

function themeParserRejectsNonStringTokenValues(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    name: "Test",
    mode: "dark",
    tokens: { "color.canvas.background": 42 }
  });
  const result = parseTheme(json);
  assert(!result.valid, "theme with non-string token value should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "tokens"),
    "should have tokens diagnostic"
  );
}

function themeParserAcceptsPluginLocalTokens(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    name: "Test",
    mode: "dark",
    tokens: { "color.canvas.background": "#000" },
    plugins: {
      "my.plugin": { tokens: { "color.custom.foreground": "#fff" } }
    }
  });
  const result = parseTheme(json);
  assert(result.valid, "theme with plugin-local tokens should be valid");
  assert(result.theme !== undefined, "theme with plugins should have a theme document");
  assert("my.plugin" in result.theme!.plugins, "plugin tokens should be present");
}

function themeParserRejectsInvalidPluginTokenObjects(): void {
  const json = JSON.stringify({
    schemaVersion: "1.0",
    id: "test",
    name: "Test",
    mode: "dark",
    tokens: {},
    plugins: {
      "my.plugin": { tokens: { "color.custom": 99 } }
    }
  });
  const result = parseTheme(json);
  assert(!result.valid, "plugin with non-string token value should be invalid");
  assert(
    result.diagnostics.some((d) => d.field === "plugins"),
    "should have plugins diagnostic"
  );
}

function themeExportPreservesSharedAndPluginTokens(): void {
  const result = parseTheme(VALID_DARK_THEME_JSON);
  assert(result.theme !== undefined, "theme should be defined before export");
  const exported = exportTheme(result.theme!);
  const reparsed = parseTheme(exported.json);
  assert(reparsed.valid, "exported theme JSON should be valid");
  assert(reparsed.theme !== undefined, "re-parsed theme should have document");
  assert(reparsed.theme!.id === "technical-calm-dark", "exported theme id should round-trip");
  assert(reparsed.theme!.tokens["color.canvas.background"] === "#0f1117", "exported tokens should round-trip");
}

function themeParserRejectsInvalidJson(): void {
  const result = parseTheme("not valid json{");
  assert(!result.valid, "invalid JSON should fail parse");
  assert(result.diagnostics.length > 0, "should have at least one diagnostic for invalid JSON");
}

themeParserAcceptsValidDarkTheme();
themeParserRejectsMissingSchemaVersion();
themeParserRejectsMissingId();
themeParserRejectsMissingName();
themeParserRejectsMissingTokens();
themeParserRejectsUnsupportedMode();
themeParserRejectsNonStringTokenValues();
themeParserAcceptsPluginLocalTokens();
themeParserRejectsInvalidPluginTokenObjects();
themeExportPreservesSharedAndPluginTokens();
themeParserRejectsInvalidJson();
