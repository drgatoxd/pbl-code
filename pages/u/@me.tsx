import {
	Container,
	Box,
	Avatar,
	Stack,
	Heading,
	Text,
	Divider,
	SimpleGrid,
	useToast
} from '@chakra-ui/react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { DiscordUser } from '../api/auth/[...nextauth]';
import axios from 'axios';
import { Spinner } from '../../components/spinner';
import { BotApplication } from '../../schemas/Bot';
import { BotCard } from '../../components/bot';

export default function MyProfile() {
	const [profile, setProfile] = useState<DiscordUser>();
	const [bots, setBots] = useState<BotApplication[]>([]);
	const priority = ['pending', 'rejected', 'approved'];
	const toast = useToast();

	useEffect(() => {
		axios.get('/api/users/@me').then(({ data }) => {
			if (!data?.['profile']) return void signIn('discord');
			setProfile(data.profile);
			axios.get('/api/users/@me/bots').then(({ data }) => {
				setBots(data.data);
			});
		});
	}, []);

	const handleCopy = () => {
		if (!navigator?.clipboard || !window?.location?.href)
			return toast({
				title: 'No se pudo copiar el enlace',
				description: 'Por favor, intenta copiarlo manualmente',
				status: 'error',
				duration: 5000,
				isClosable: true
			});
		navigator.clipboard
			.writeText(
				`${window.location.href.split('/').slice(0, 3).join('/')}/u/${
					profile?.id
				}`
			)
			.then(() => {
				return toast({
					description: 'Enlace copiado al portapapeles',
					status: 'success',
					duration: 5000,
					isClosable: true
				});
			})
			.catch(() => {
				return toast({
					title: 'No se pudo copiar el enlace',
					description: 'Por favor, intenta copiarlo manualmente',
					status: 'error',
					duration: 5000,
					isClosable: true
				});
			});
	};

	return (
		<Container maxW={'container.lg'}>
			<Head>
				<title>
					{`${
						profile
							? `${profile.username}#${profile.discriminator}`
							: 'Cargando...'
					} - Pubertland BotList`}
				</title>
			</Head>

			{!profile ? (
				<Container justifyContent={'center'} display={'flex'}>
					<Spinner />
				</Container>
			) : (
				<>
					{!!profile.banner && (
						<Box
							position={'fixed'}
							top={0}
							left={0}
							zIndex={-100}
							minH={'100vh'}
							bgSize={'cover'}
							bgAttachment={'fixed'}
							bgPosition={'center'}
							bgImage={
								profile.banner
									? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${profile.banner})`
									: 'unset'
							}
							minW={'100%'}
						></Box>
					)}

					<Stack
						direction={['column', 'row']}
						align={'center'}
						justify={'center'}
						gap={5}
						w={'100%'}
						mt={5}
					>
						<Avatar
							src={profile.avatar}
							name={profile.username || 'Cargando...'}
							size={'xl'}
						/>
						<Stack>
							<Heading textAlign={'center'} noOfLines={1} maxW={'80vw'}>
								{profile.username}
								<Text as={'span'} color={'gray.500'}>
									#{profile.discriminator || '0000'}
								</Text>
							</Heading>
							<Text
								cursor="pointer"
								_hover={{ color: 'gray.200' }}
								transition=".1s ease"
								onClick={handleCopy}
								textAlign={['center', 'left', 'left']}
								color={'gray.400'}
								w="min-content"
							>
								u/{profile.id}
							</Text>
						</Stack>
					</Stack>
					<Divider my={10} />
					<Stack>
						<Box>
							<Heading
								textAlign={['center', 'center', 'left']}
								as={'h3'}
								fontSize={'2xl'}
							>
								Bots de {profile.username}
							</Heading>
							<Text
								textAlign={['center', 'center', 'left']}
								as={'p'}
								color={'gray.500'}
								size={'sm'}
							>
								{bots.length} bots
							</Text>
						</Box>
						<SimpleGrid p={5} spacing={5} columns={[1, 1, 2, 3, 3, 3, 4]}>
							{bots.length ? (
								bots
									.sort(
										(x, y) =>
											priority.indexOf(x.state) - priority.indexOf(y.state)
									)
									.map((b, i) => (
										<BotCard
											setBots={setBots}
											zIndex={10 + (bots.length - i)}
											itsMyBot
											key={i}
											bot={b}
										/>
									))
							) : (
								<Heading
									fontWeight={'normal'}
									color={'gray.400'}
									as={'span'}
									fontSize={'xl'}
									textAlign={['center', 'center', 'left']}
								>
									No tienes ningún bot
								</Heading>
							)}
						</SimpleGrid>
					</Stack>
				</>
			)}
		</Container>
	);
}
