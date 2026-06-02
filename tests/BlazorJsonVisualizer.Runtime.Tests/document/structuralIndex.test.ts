import {
  buildStructuralIndex,
  listChildNodeIds,
  isFoldable
} from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/document/structuralIndex.js";
import { tokenize } from "../../../src/BlazorJsonVisualizer.Runtime/runtime-core/src/json/tokenizer.js";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

function buildFrom(src: string) {
  return buildStructuralIndex(tokenize(src), src);
}

// Empty source
{
  const index = buildFrom("");
  const root = index.nodesById[index.rootNodeId];
  assert(root?.kind === "document", "root should be document");
  assert(index.nodeOrder.length === 1, "only document node for empty source");
}

// Simple string
{
  const index = buildFrom('"hello"');
  const root = index.nodesById[index.rootNodeId];
  const children = listChildNodeIds(index, index.rootNodeId);
  assert(children.length === 1, "document has one child");
  const child = index.nodesById[children[0] as string];
  assert(child?.kind === "string", "child is string node");
  assert(root !== undefined && children[0] === root.firstChildId, "firstChildId set");
}

// Simple number
{
  const index = buildFrom("42");
  const children = listChildNodeIds(index, index.rootNodeId);
  assert(index.nodesById[children[0] as string]?.kind === "number", "number kind");
}

// Object with properties
{
  const src = '{"a":1,"b":true}';
  const index = buildFrom(src);
  const children = listChildNodeIds(index, index.rootNodeId);
  assert(children.length === 1, "one top-level value");

  const objId = children[0] as string;
  const obj = index.nodesById[objId];
  assert(obj?.kind === "object", "object kind");
  assert(isFoldable(obj!), "objects are foldable");

  const props = listChildNodeIds(index, objId);
  assert(props.length === 2, `expected 2 properties, got ${props.length}`);

  const propA = index.nodesById[props[0] as string];
  assert(propA?.kind === "property", "first child is property");
  assert(propA?.propertyName === "a", "property name is a");

  const valA = listChildNodeIds(index, props[0] as string);
  assert(valA.length === 1, "property has one value child");
  assert(index.nodesById[valA[0] as string]?.kind === "number", "property a value is number");
}

// Array
{
  const src = "[1,2,3]";
  const index = buildFrom(src);
  const children = listChildNodeIds(index, index.rootNodeId);
  const arrId = children[0] as string;
  assert(index.nodesById[arrId]?.kind === "array", "array kind");

  const items = listChildNodeIds(index, arrId);
  assert(items.length === 3, `expected 3 items, got ${items.length}`);
}

// Nested objects
{
  const src = '{"outer":{"inner":99}}';
  const index = buildFrom(src);
  const objId = listChildNodeIds(index, index.rootNodeId)[0] as string;
  const outerPropId = listChildNodeIds(index, objId)[0] as string;
  const outerProp = index.nodesById[outerPropId];
  assert(outerProp?.propertyName === "outer", "outer property name");

  const innerObjId = listChildNodeIds(index, outerPropId)[0] as string;
  assert(index.nodesById[innerObjId]?.kind === "object", "inner object kind");

  const innerPropId = listChildNodeIds(index, innerObjId)[0] as string;
  const innerProp = index.nodesById[innerPropId];
  assert(innerProp?.propertyName === "inner", "inner property name");
}

// nodeOrder has all nodes
{
  const src = '{"x":1}';
  const index = buildFrom(src);
  assert(index.nodeOrder.length > 1, "multiple nodes in order");
  for (const id of index.nodeOrder) {
    assert(index.nodesById[id] !== undefined, `node ${id} in order must be in nodesById`);
  }
}

// Malformed: extra closing brace (graceful)
{
  const src = '{"a":1}}';
  const index = buildFrom(src);
  assert(index.rootNodeId !== undefined, "malformed input still produces root");
}

console.log("structuralIndex tests passed");
