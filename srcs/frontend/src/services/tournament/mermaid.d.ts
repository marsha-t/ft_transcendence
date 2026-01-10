// Ambient declaration for Mermaid package
// This allows TypeScript to accept the import
declare module "mermaid" {
  const mermaid: any;
  export default mermaid;
}
