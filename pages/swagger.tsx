import React, { useEffect, useState } from 'react';
import ReactSwagger from '../components/SwaggerUI/ReactSwagger';
import Head from 'next/head'; // Add this import

export default function SwaggerPage() {
  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch('/api/swagger')
      .then(res => res.json())
      .then(setSpec);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <Head>
        <link rel="stylesheet" href="/swagger-custom.css" />
      </Head>
      {spec ? <ReactSwagger spec={spec} /> : <div>Loading...</div>}
    </div>
  );
}
