import Head from 'next/head'
import Link from 'next/link'

const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0559/0450/1875/files/GC4C_SVG_Logo.svg?v=1745920148'

export default function Home() {
  return (
    <>
      <Head>
        <title>GolfClubs4Cash — Payment Forms</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #e8f5ee 0%, #f0faf4 50%, #e3f4eb 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px 16px;
          }
          .wrap {
            width: 100%;
            max-width: 480px;
            text-align: center;
          }
          .logo {
            height: 52px;
            margin-bottom: 36px;
          }
          h1 {
            font-size: 22px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          p {
            font-size: 15px;
            color: #555;
            margin-bottom: 36px;
          }
          .cards {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
          .card {
            display: block;
            background: #fff;
            border: 1.5px solid #d4eadc;
            border-radius: 14px;
            padding: 28px 32px;
            text-decoration: none;
            color: inherit;
            transition: border-color 0.2s, box-shadow 0.2s, transform 0.15s;
            box-shadow: 0 2px 8px rgba(0,95,44,0.06);
          }
          .card:hover {
            border-color: #005F2C;
            box-shadow: 0 6px 20px rgba(0,95,44,0.13);
            transform: translateY(-2px);
          }
          .card-title {
            font-size: 17px;
            font-weight: 700;
            color: #005F2C;
            margin-bottom: 6px;
          }
          .card-desc {
            font-size: 14px;
            color: #666;
          }
          .arrow {
            display: inline-block;
            margin-left: 6px;
            transition: transform 0.15s;
          }
          .card:hover .arrow {
            transform: translateX(4px);
          }
        `}</style>
      </Head>
      <div className="wrap">
        <img src={LOGO_URL} alt="GolfClubs4Cash" className="logo" />
        <h1>Payment Forms</h1>
        <p>Select the form for your team below.</p>
        <div className="cards">
          <Link href="/comms-payment" className="card">
            <div className="card-title">Comms Team <span className="arrow">→</span></div>
            <div className="card-desc">Customer payment submissions for the communications team</div>
          </Link>
          <Link href="/store-payment" className="card">
            <div className="card-title">Store Team <span className="arrow">→</span></div>
            <div className="card-desc">In-store customer payment submissions</div>
          </Link>
        </div>
      </div>
    </>
  )
}
