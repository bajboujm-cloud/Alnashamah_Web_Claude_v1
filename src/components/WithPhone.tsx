/** Puts a phone number into a sentence ("… {phone} …"), always shown left-to-right, even in Arabic. */
export function WithPhone({ text, phone }: { text: string; phone: string }) {
  const [before, after = ""] = text.split("{phone}");
  return (
    <>
      {before}
      <bdi dir="ltr" className="whitespace-nowrap">
        {phone}
      </bdi>
      {after}
    </>
  );
}
