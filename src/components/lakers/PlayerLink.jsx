export default function PlayerLink({ name }) {
  return (
    <span
      style={{ color: '#7aa5ff' }}
      className="font-medium cursor-pointer hover:underline"
    >
      {name}
    </span>
  );
}