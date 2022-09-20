import { Button, Container, Heading, Text } from '@chakra-ui/react';
import Head from 'next/head';
import { Link } from '../components/link';

export default function NotFound() {
	return (
		<Container
			textAlign={'center'}
			display={'flex'}
			flexDir={'column'}
			alignItems={'center'}
			justifyContent={'center'}
			minH="80vh"
			gap={5}
		>
			<Head>
				<title>404 - Pubertland BotList</title>
			</Head>
			<Heading fontSize={'7xl'} as="h1">
				404
			</Heading>
			<Text color="gray.400" fontSize={'sm'}>
				¡Ups! No encontramos la página que estabas buscando.
				<br />
				Te regresaremos al inicio.
			</Text>
			<Link href="/">
				<Button colorScheme={'purple'}>Inicio</Button>
			</Link>
		</Container>
	);
}
