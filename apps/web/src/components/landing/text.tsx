/** Words that rise from behind their own line, one after another: the library's word-rise, on the page's titles. */
export function Rise({ text }: { text: string }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i}>
          <span className="rise-w"><span style={{ "--i": i } as React.CSSProperties}>{w}</span></span>{" "}
        </span>
      ))}
    </>
  );
}
