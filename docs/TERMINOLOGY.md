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

## Render Row

A single visible row in the viewport, derived from the structural index and folding state. Each render row maps to a structural node and carries display text and metadata.

## JSON Tokenizer

The Layer 1 component that converts JSON source text into a flat sequence of typed token ranges without building a parse tree or JavaScript object.

## JSON Pointer

A path syntax (RFC 6901) used to identify nodes within a JSON document. Segments are separated by `/`. `~0` encodes `~`; `~1` encodes `/`.

## Overlay

Metadata displayed over the JSON document without owning the canonical document model.

## Projection

An alternate view over supported JSON structure, such as a table or statistical explorer.

## Transaction

A deterministic runtime operation that changes document state and may produce patches or events.

## Short-Running Test

A small deterministic test that completes quickly with no external dependencies. May run automatically in CI and during agent work. Synonym: fast test.

## Long-Running Test

A stress test, benchmark runner, huge-document test, fuzzing harness, endurance test, or large browser automation suite. Must not run automatically unless explicitly requested.

## Guardrail

A project-wide constraint that all contributors and AI agents must follow during implementation. Guardrails define scope, quality, testing, and documentation boundaries.

## Engineering Guide

The concrete engineering substrate documentation: command contracts, build tooling, toolchain setup, building blocks, and optional modules.

## Command Contract

The canonical definition of `eng/` script names, purposes, and expected behaviors. Agents must not invent commands outside the contract.

## Document Authority

The designation of which document is the single source of truth for a given topic. Authoritative documents supersede research, comments, and informal descriptions.

## Document Contract

The cross-reference rule that lists which documents must be reviewed when an authoritative document changes.

## Building Block

A modular capability package from the Engineering Guide V3. Each block adds specific files, commands, and conventions to the repository.

## Optional Module

An engineering capability that is absent by default and must be explicitly activated in a milestone. Examples: Playwright, BenchmarkDotNet, NuGet packaging, GitHub Pages.

## Public Documentation

User-facing documentation intended for external consumers, maintained under `public-docs/` and synchronized with supported behavior.

## Consumer

A user of published or externally documented surfaces, including package users, API users, diagnostics readers, sample users, and release readers.

## Public Documentation Surface

A specific user-facing documentation output that must stay synchronized, such as README user sections, getting-started docs, package README content, API docs, diagnostics references, and release notes.

## Package README

The consumer-facing README content shipped with a package, sourced from `public-docs/nuget/package-readme.md`.

## Diagnostics Reference

Consumer-facing diagnostics documentation that explains identifiers, meanings, and supported mitigation guidance.

## Public API Baseline

An intentional, versioned definition of the approved public API surface used to detect accidental breaking or additive changes.

## Release Readiness

A validation state indicating public docs, package smoke checks, API checks, samples, and release notes are aligned for a versioned release.

## Package Smoke Test

A consumer-style validation run against locally packed artifacts to verify package installability and basic usability before publishing.
