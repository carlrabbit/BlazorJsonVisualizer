# Terminology

## Editor

In this repository, editor does not mean a general-purpose text editor. It means a structured JSON visualization and manipulation environment.

## Blazor Host

The .NET/Blazor package and application surface that configures, mounts, and communicates with the browser runtime.

## Browser Runtime

The TypeScript runtime executing in the browser. It owns JSON viewing, navigation, rendering coordination, and eventually editing behavior.

## Runtime Core

The framework-free TypeScript package that owns document sessions, structural indexes, transactions, and protocol types.

## Structural JSON Document

The canonical runtime representation of a JSON document as indexed structure, not merely as a string.

## Structural Index

An index of JSON nodes, ranges, parent-child relationships, depth, folding state, and related metadata.

## Document Session

A runtime instance representing one loaded document, its revision, viewport state, and change state.

## Viewport

The currently visible rendered portion of the document.

## Overlay

Metadata displayed over the JSON document without owning the canonical document model.

## Projection

An alternate view over supported JSON structure, such as a table or statistical explorer.

## Transaction

A deterministic runtime operation that changes document state and may produce patches or events.

## Fast Test

A small deterministic test that should run by default in normal CI and during agent work.

## Long-Running Test

A stress, benchmark, huge-document, fuzzing, endurance, or large browser automation test that must not run automatically.
