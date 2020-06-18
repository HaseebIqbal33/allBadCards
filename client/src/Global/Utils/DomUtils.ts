export const selectElementText = (el: Element | null | undefined) =>
{
	if(!el)
	{
		return;
	}

	let doc = window.document, sel, range;
	const body = doc.body as any;
	if (window.getSelection && doc.createRange)
	{
		sel = window.getSelection();
		range = doc.createRange();
		range.selectNodeContents(el);
		sel?.removeAllRanges();
		sel?.addRange(range);
	}
	else if (body.createTextRange)
	{
		range = body.createTextRange();
		range.moveToElementText(el);
		range.select();
	}
};