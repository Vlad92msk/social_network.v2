
interface MediaOtherProps {
  files: any[];
}

export function MediaOther({ files }: MediaOtherProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="MediaOther">
      {files.map((file, index) => (
        <div key={index} className="MediaOther-item">
          <a href={file.url} download>
            {file.name}
          </a>
        </div>
      ))}
    </div>
  );
}
