/*
 * Shared ReSpec configuration for ATP Community Group specifications.
 *
 * Each spec sets `window.specConfig` (shortName, title, subtitle) in its
 * <head>, then loads this file. We translate that into a full `respecConfig`
 * for a W3C Community Group draft. Per-spec local references live in biblio.js.
 */
(function () {
  "use strict";

  var spec = window.specConfig || {};

  // eslint-disable-next-line no-undef
  window.respecConfig = {
    // Use "unofficial" until the ATP Community Group is formally registered
    // with W3C. ReSpec resolves `group` against the W3C API, so setting a
    // not-yet-registered group (e.g. "atp") would 404 and break the render.
    // Once the CG is registered, switch to "CG-DRAFT" and add group: "atp".
    specStatus: "unofficial",
    shortName: spec.shortName || "atp-spec",
    editors: [
      {
        name: "Larry Lewis",
        company: "Sovr Labs",
        companyURL: "https://sovrlabs.com",
      },
    ],
    github: {
      repoURL: "https://github.com/agent-trust-protocol/atp-core",
      branch: "main",
    },
    // Local bibliography entries (FIPS 204, RFC 9964, did:wba, etc.).
    localBiblio: window.atpBiblio || {},
    subtitle: spec.subtitle || "",
    xref: ["DID-CORE", "VC-DATA-MODEL", "INFRA"],
    // Input drafts (pre-adoption) render under CC-BY. On CG adoption, switch
    // specStatus to "CG-DRAFT" and ReSpec applies the W3C Community CLA. Repo-level
    // licensing (spec contributions under the W3C CLA) lives in LICENSE.md.
    license: "cc-by",
  };
})();
