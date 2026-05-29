import { publicReleaseFeed } from "../lib/public-release-feed";

export function PublicReleaseFeed() {
  return (
    <div className="grid">
      {publicReleaseFeed.map((item) => (
        <article className="card" key={item.xPost}>
          <div className="eyebrow">{item.date}</div>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <div className="mini-list">
            <a href={item.website}>Website</a>
            <a href={item.repo}>GitHub</a>
            <a href={item.xPost}>X update</a>
            <a href={item.farcaster}>Farcaster mirror</a>
          </div>
        </article>
      ))}
    </div>
  );
}
