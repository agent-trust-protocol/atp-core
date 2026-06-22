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
    specStatus: "CG-DRAFT",
    shortName: spec.shortName || "atp-spec",
    // ATP Community Group (coordinates with the W3C AI Agent Protocol CG).
    group: "atp",
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
    license: "w3c-software-doc",
  };
})();
