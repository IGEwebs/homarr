import ping from 'ping';
import { NextApiRequest, NextApiResponse } from 'next';

async function Get(req: NextApiRequest, res: NextApiResponse) {
  // Parse req.body as a AppItem
  const { url } = req.query;
  // Parse url as URL object
  const parsedUrl = new URL(url as string);
  // Ping the URL
  const response = await ping.promise.probe(parsedUrl.hostname, {
    timeout: 1,
  });

  // Return 200 if the alive property is true
  if (response.alive) {
    return res.status(200).end();
  }
  // Return 404 if the alive property is false
  return res.status(404).end();
}

export default async (req: NextApiRequest, res: NextApiResponse) => {
  // Filter out if the reuqest is a POST or a GET
  if (req.method === 'GET') {
    return Get(req, res);
  }
  return res.status(405).json({
    statusCode: 405,
    message: 'Method not allowed',
  });
};
