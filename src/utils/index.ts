export { parseArguments } from './argParser.js';
export { loadConfig } from './config-loader.js';
export type { Config } from './config-loader.js';
export {
  listSpaces,
  getSpace,
  listPages,
  getPage,
  createPage,
  updatePage,
  addComment,
  deletePage,
  getUser,
  testConnection,
  clearClients,
} from './confluence-client.js';
