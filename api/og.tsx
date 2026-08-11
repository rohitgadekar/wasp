import { ImageResponse } from '@vercel/og';

export const config = {
    runtime: 'edge',
};

export default async function handler(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        const title = searchParams.get('title')?.slice(0, 100) || 'Wasp';
        const description = searchParams.get('description')?.slice(0, 200) || '';

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        justifyContent: 'center',
                        backgroundColor: '#0f172a',
                        padding: '60px 80px',
                        color: 'white',
                        fontFamily: 'system-ui, sans-serif',
                    }}
                >
                    <div
                        style={{
                            fontSize: 28,
                            fontWeight: 600,
                            color: '#94a3b8',
                            marginBottom: 40,
                        }}
                    >
                        Wasp
                    </div>

                    <div
                        style={{
                            fontSize: title.length > 40 ? 48 : 64,
                            fontWeight: 700,
                            lineHeight: 1.2,
                            marginBottom: description ? 24 : 0,
                        }}
                    >
                        {title}
                    </div>

                    {description && (
                        <div
                            style={{
                                fontSize: 28,
                                color: '#94a3b8',
                                lineHeight: 1.4,
                                maxWidth: '90%',
                            }}
                        >
                            {description}
                        </div>
                    )}
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e: any) {
        console.log(e.message);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}