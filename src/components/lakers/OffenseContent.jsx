import PlayerLink from './PlayerLink';

export default function OffenseContent() {
  return (
    <div className="px-5 pt-3 pb-32">
      <h1 className="text-[22px] font-bold leading-tight mb-3" style={{ color: '#e0e0e0' }}>
        The 1986–87 Los Angeles Lakers: Showtime & High-Post Isolation
      </h1>
      <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#c0c0c0' }}>
        The 1986-87 Lakers ran one of the most efficient and electrifying offenses in NBA history,
        blending a relentless fast break with structured halfcourt sets designed to maximize the
        unique talents of their roster.
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            The Showtime Fast Break
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            When opponents missed, the Lakers turned defense into instant offense.{' '}
            <PlayerLink name="Magic Johnson" /> grabbed the rebound and sprinted down the floor, eyes
            scanning for <PlayerLink name="Michael Cooper" /> or <PlayerLink name="Byron Scott" />{' '}
            filling the lanes on either wing. <PlayerLink name="James Worthy" /> raced ahead for a
            rim-run, and if the break stalled, <PlayerLink name="Kareem Abdul-Jabbar" /> trailed as
            the safety valve.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            The Halfcourt &ldquo;Pick&rdquo; and Post-Up
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            In the halfcourt, the Lakers ran a 1-4 set with <PlayerLink name="Magic Johnson" /> and{' '}
            <PlayerLink name="AC Green" /> in a high pick-and-roll. When the defense switched, Magic
            exploited the mismatch with his size and court vision, often dumping to Green for a dunk
            or hitting the junior, junior skyhook — a mini-hook over smaller defenders.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            Isolation in the Low Post
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            When the game slowed down, the Lakers fed <PlayerLink name="Kareem Abdul-Jabbar" /> on
            the left block for his unstoppable skyhook, the highest-percentage shot in basketball. If
            doubled, he kicked out to shooters, while <PlayerLink name="James Worthy" /> worked the
            baseline for his signature spin-move layups.
          </p>
        </section>
      </div>
    </div>
  );
}