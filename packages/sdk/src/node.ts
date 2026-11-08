/** Explicit Node entry point: browser-facing root imports stay unchanged. */
import { DidAtpResolver, type DidResolutionResult, type ResolveOptions } from './utils/resolver.js';
import { createNodeDidFetch, type NodeDidFetchOptions } from './utils/node-did-fetch.js';
export { createNodeDidFetch };
export type { NodeDidFetchOptions, DidAddress } from './utils/node-did-fetch.js';

export interface NodeDidResolveOptions extends Omit<ResolveOptions, 'fetch'> {
  egress?: NodeDidFetchOptions;
}
/** Resolve with the Node address policy and connection pinning enabled by default. */
export async function resolveDidWithNodeEgress(did: string, options: NodeDidResolveOptions = {}): Promise<DidResolutionResult> {
  const { egress, ...resolverOptions } = options;
  return DidAtpResolver.resolve(did, { ...resolverOptions, fetch: createNodeDidFetch(egress) });
}
