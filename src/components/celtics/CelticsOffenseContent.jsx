import PlayerLink from '@/components/lakers/PlayerLink';

export default function CelticsOffenseContent() {
  return (
    <div className="px-5 pt-3 pb-32">
      <h1 className="text-[22px] font-bold leading-tight mb-3" style={{ color: '#e0e0e0' }}>
        The 1986-87 Boston Celtics: The Passing Game Motion Offense
      </h1>
      <p className="text-[14px] leading-relaxed mb-6" style={{ color: '#c0c0c0' }}>
        Head coach K.C. Jones deployed a highly fluid, read-and-react{' '}
        <span className="font-semibold" style={{ color: '#e0e0e0' }}>Motion Offense</span> that relied
        heavily on basketball IQ, floor spacing, and precise passing rather than rigid, diagrammed
        plays.
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            The High-Low Post Game
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            With a frontcourt of <PlayerLink name="Larry Bird" />, <PlayerLink name="Kevin McHale" />,
            and <PlayerLink name="Robert Parish" />, Boston ran a dominant high-low game. McHale or
            Parish would seal their defender deep in the paint, while <PlayerLink name="Larry Bird" /> or{' '}
            <PlayerLink name="Danny Ainge" /> fed them perfectly timed over-the-top passes from the
            high post or perimeter.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            Ball Movement &amp; Spatial Awareness
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            The Celtics prioritized the &ldquo;extra pass.&rdquo; If a defender rotated to stop a{' '}
            <PlayerLink name="Kevin McHale" /> post-up, the ball was immediately swung out to{' '}
            <PlayerLink name="Danny Ainge" /> or <PlayerLink name="Dennis Johnson" /> on the
            perimeter, or back inside to a cutting teammate.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold mb-1.5" style={{ color: '#e0e0e0' }}>
            Larry Bird&rsquo;s Off-Screen Actions
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: '#c0c0c0' }}>
            While <PlayerLink name="Larry Bird" /> was a brilliant passer from the forward position,
            the Celtics also ran him off a series of baseline screens. This allowed him to catch and
            shoot from the mid-range or find an open lane to cut directly to the basket.
          </p>
        </section>
      </div>
    </div>
  );
}