import { parse } from 'cookie';

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method === 'POST') {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ success: false, error: 'Password is required' });
            }

            if (password === process.env.ADMIN_PASSWORD) {
                res.setHeader('Set-Cookie', `adminToken=${process.env.ADMIN_PASSWORD}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`);
                return res.status(200).json({ success: true, message: 'Login successful' });
            } else {
                return res.status(401).json({ success: false, error: 'Incorrect password' });
            }
        } catch (error) {
            console.error('Login error:', error);
            return res.status(500).json({ success: false, error: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
