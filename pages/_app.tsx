import '../styles/globals.css';
import type { AppProps } from 'next/app';
import {
	ChakraProvider,
	DeepPartial,
	extendTheme,
	theme as Base,
	Theme
} from '@chakra-ui/react';
import NextNProgress from 'nextjs-progressbar';
import { SessionProvider } from 'next-auth/react';
import { Navbar } from '../components/navbar';
import { StepsStyleConfig as Steps } from 'chakra-ui-steps';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Head from 'next/head';
import { Link } from '../components/link';
import { mode, StyleConfig, StyleFunctionProps } from '@chakra-ui/theme-tools';

const theme = {
	config: {
		initialColorMode: 'dark',
		useSystemColorMode: false,
		disableTransitionOnChange: false
	},
	components: {
		Steps,
		Container: {
			baseStyle: (props: StyleFunctionProps) => ({
				bg: mode('red.100', 'red.900')(props)
			})
		}
	},
	fonts: {
		heading: 'Manrope'
	},
	styles: {
		global: {
			body: {
				bg: 'radial-gradient(circle, #2a283d 0%, #0b0a15 100%)',
				bgSize: 'cover',
				bgPosition: 'center',
				bgAttachment: 'fixed'
			}
		}
	},
	colors: {
		gray: {
			'50': '#f7f7fc',
			'100': '#eeedf7',
			'200': '#e3e2f0',
			'300': '#cdcbe0',
			'400': '#a6a9c0',
			'500': '#7e869d',
			'600': '#4f5367',
			'700': '#313348',
			'800': '#1e202d',
			'900': '#1d2028'
		},
		brand: Base.colors.pink['100']
	}
};

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
	const [user, setUser] = useState<{ banned: boolean }>();

	useEffect(() => {
		axios.get('/api/users/@me').then(({ data }) => {
			setUser(data?.profile);
		});
	}, []);

	if (user && user.banned) {
		return (
			<div>
				<Head>
					<title>Baneado xd</title>
				</Head>
				Haz sido baneado de la botlist. Contacta con un administrador si crees
				que se trata de un error.{' '}
				<a href="https://discord.gg/Z4wj6gYyvE">
					https://discord.gg/Z4wj6gYyvE
				</a>
				<br />
				<br />
				<Link href="/api/auth/signout">Salir</Link>
			</div>
		);
	}

	return (
		<SessionProvider session={session}>
			<ChakraProvider theme={extendTheme(theme)}>
				<NextNProgress color="salmon" />
				<Navbar />
				<Component {...pageProps} />
			</ChakraProvider>
		</SessionProvider>
	);
}

export default MyApp;
