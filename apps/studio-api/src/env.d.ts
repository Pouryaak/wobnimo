/* Markdown files are bundled as text (see the rules in wrangler.toml). */
declare module '*.md' {
  const text: string;
  export default text;
}
