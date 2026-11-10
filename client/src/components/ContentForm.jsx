export const emptyContent = { title: '', content: '' };

export default function ContentForm({
  value,
  onChange,
  onSubmit,
  busy,
  label,
  onCancel,
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <p>
        <label>
          Title{' '}
          <input
            required
            maxLength={200}
            value={value.title}
            onChange={(event) =>
              onChange({ ...value, title: event.target.value })
            }
          />
        </label>
      </p>
      <p>
        <label>
          Content{' '}
          <textarea
            maxLength={20000}
            value={value.content}
            onChange={(event) =>
              onChange({ ...value, content: event.target.value })
            }
          />
        </label>
      </p>
      <button disabled={busy}>{label}</button>
      {onCancel && (
        <button type="button" onClick={onCancel}>
          Cancel edit
        </button>
      )}
    </form>
  );
}
