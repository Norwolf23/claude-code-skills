'use client';
// Renders text from the content store. In view mode it's just text. In edit mode it becomes
// a contentEditable element with a hover outline; commits on blur or Enter. Pass `multiline`
// for paragraph fields (Shift+Enter inserts a line break, Enter commits).
import { useEffect, useRef } from 'react';
import { getAtPath, useContent, useEditMode } from './ContentContext';

export function EditableText({
  path,
  as: Tag = 'span',
  fallback = '',
  multiline = false,
  className = '',
  placeholder = '',
  ...rest
}) {
  const { content } = useContent();
  const edit = useEditMode();
  const editing = !!edit?.editing;
  const ref = useRef(null);

  const value =
    (editing ? getAtPath(edit.draft, path) : getAtPath(content, path)) ?? fallback;

  // Keep DOM text in sync when the source value changes (e.g. discard) without breaking caret.
  useEffect(() => {
    if (!editing || !ref.current) return;
    if (ref.current.innerText !== String(value)) {
      ref.current.innerText = String(value);
    }
  }, [value, editing]);

  if (!editing) {
    return <Tag className={className} {...rest}>{value}</Tag>;
  }

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-cms-field={path}
      data-cms-empty={value === '' ? 'true' : undefined}
      data-cms-placeholder={placeholder || path}
      className={`${className} cms-editable`}
      onBlur={(e) => {
        const next = multiline ? e.currentTarget.innerText : e.currentTarget.innerText.replace(/\n/g, ' ').trim();
        if (next !== value) edit.setField(path, next);
      }}
      onKeyDown={(e) => {
        if (!multiline && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (multiline && e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
      onPaste={(e) => {
        // strip rich-text on paste
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
      }}
      {...rest}
    >
      {value}
    </Tag>
  );
}

export default EditableText;
