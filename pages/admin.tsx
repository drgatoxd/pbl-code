import { signIn } from 'next-auth/react';
import type { DiscordUser } from './api/auth/[...nextauth]';
import { useEffect, useState } from 'react';
import {
	Avatar,
	Box,
	Button,
	Container,
	Flex,
	FormLabel,
	Heading,
	Input,
	InputGroup,
	InputRightElement,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	ModalBody,
	ModalCloseButton,
	ModalFooter,
	ModalOverlay,
	SimpleGrid,
	Stack,
	Textarea,
	useDisclosure,
	useToast
} from '@chakra-ui/react';
import axios from 'axios';
import { Spinner } from '../components/spinner';
import { BotApplication } from '../schemas/Bot';
import { BotCard } from '../components/bot';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { Ban } from './api/bans';
import { Icon } from '../components/icon';
import { Modal, ModalHeader, ModalContent } from '../components/Modal';

export default function Admin() {
	const [profile, setProfile] = useState<DiscordUser>();
	const [activeTab, setActiveTab] = useState('manage-bots');
	const router = useRouter();

	useEffect(() => {
		let profile: unknown | undefined;

		axios.get('/api/users/@me').then(({ data }) => {
			if (!data?.['profile']) return void signIn('discord');
			if (!(data?.['profile'] as DiscordUser).verified) {
				return;
			}
			setProfile(data.profile);
			profile = data.profile;
		});

		const timeout = setTimeout(() => {
			if (!profile)
				return void router.push('https://www.youtube.com/watch?v=mCdA4bJAGGk');
		}, 5000);

		return () => clearTimeout(timeout);
	}, []);

	if (!profile)
		return (
			<Container maxW={'container.sm'}>
				<Container
					mt={'50px'}
					justifyContent={'center'}
					alignItems={'center'}
					gap={5}
					textAlign={'center'}
				>
					<Spinner size={'md'} />
					<br />
					Cargando panel...
				</Container>
				<Flex mt={5} justify={'center'}>
					<Button as={'a'} href={'/'}>
						Inicio
					</Button>
				</Flex>
			</Container>
		);

	return (
		<Container mt={'50px'} maxW={'container.xl'}>
			<Head>
				<title>
					{`${
						activeTab == 'manage-bots'
							? 'Gestionar Bots'
							: activeTab == 'bans'
							? 'Baneos'
							: 'Admin'
					} - Pubertland BotList`}
				</title>
			</Head>
			<Flex
				gap={5}
				justify={'space-between'}
				flexDir={['column-reverse', 'row']}
			>
				<Heading as={'h1'}>
					{activeTab == 'manage-bots'
						? 'Gestionar Bots'
						: activeTab == 'bans'
						? 'Baneos'
						: 'PBL Admin'}
				</Heading>
				<Box>
					<Menu>
						<MenuButton as={Button}>Cambiar panel</MenuButton>
						<MenuList>
							<MenuItem onClick={() => setActiveTab('manage-bots')}>
								Gestionar bots
							</MenuItem>
							<MenuItem onClick={() => setActiveTab('bans')}>Baneos</MenuItem>
						</MenuList>
					</Menu>
				</Box>
			</Flex>
			{activeTab == 'manage-bots' ? (
				<BotsPanel />
			) : activeTab == 'bans' ? (
				<BansPanel />
			) : (
				<></>
			)}
		</Container>
	);
}

function ModalForm({
	bot,
	action,
	isOpen,
	onClose,
	setBots
}: {
	bot: BotApplication;
	action: 'approve' | 'deny';
	isOpen: boolean;
	onClose: () => void;
	setBots: (
		bots: BotApplication[] | ((prev: BotApplication[]) => BotApplication[])
	) => void;
}) {
	const [reason, setReason] = useState('');
	const [fetching, setFetching] = useState(false);
	const toast = useToast();

	if (!bot) return <></>;

	const handleSubmit = () => {
		if (!reason?.length) {
			toast({
				title: 'Error',
				description: 'Por favor, escribe una razón',
				status: 'error',
				duration: 5000,
				isClosable: true,
				variant: 'subtle'
			});
			return;
		}
		setFetching(true);
		axios
			.patch(`/api/bots/${bot.id}/manage`, {
				action,
				reason
			})
			.then(() => {
				setFetching(false);
				onClose();
				setReason('');
				setBots(prev =>
					prev.map(b => {
						if (b.id === bot.id) {
							b.state = action == 'approve' ? 'approved' : 'rejected';
						}
						return b;
					})
				);

				toast({
					title: `Bot ${action == 'approve' ? 'aprobado' : 'denegado'}`,
					description: `El bot ${bot.tag} ha sido ${
						action == 'approve' ? 'aprobado' : 'denegado'
					}`,
					status: 'info',
					variant: 'subtle',
					duration: 5000,
					isClosable: true
				});
			})
			.catch(err => {
				setFetching(false);
				toast({
					title: `Error`,
					description: err?.response?.error || err?.message,
					status: 'error',
					variant: 'subtle',
					duration: 5000,
					isClosable: true
				});
			});
	};

	return (
		<Modal
			closeOnEsc={!fetching}
			closeOnOverlayClick={false}
			isCentered
			motionPreset={'slideInBottom'}
			isOpen={isOpen}
			onClose={onClose}
		>
			<ModalContent bg={'gray.900'}>
				<ModalHeader
					pb={2}
					h="min-content"
					title={`¿Deseas ${action == 'approve' ? 'aprobar' : 'denegar'} a ${
						bot.tag
					}?`}
				/>
				<ModalCloseButton disabled={fetching} />
				<ModalBody>
					<FormLabel>Razón</FormLabel>
					<Textarea
						disabled={fetching}
						focusBorderColor={action == 'approve' ? 'green.500' : 'red.500'}
						value={reason}
						onChange={e => setReason(e.target.value)}
						maxLength={4000}
					/>
				</ModalBody>
				<ModalFooter>
					<Button
						disabled={fetching}
						variant={'ghost'}
						mr={3}
						onClick={() => {
							onClose();
							setReason('');
						}}
					>
						Salir
					</Button>
					<Button
						disabled={fetching}
						variant="ghost"
						colorScheme={action == 'approve' ? 'green' : 'red'}
						onClick={handleSubmit}
					>
						{fetching ? (
							<Spinner />
						) : action == 'approve' ? (
							'Aprobar'
						) : (
							'Denegar'
						)}
					</Button>
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

function BotsPanel() {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [query, setQuery] = useState('');
	const [bots, setBots] = useState<BotApplication[]>([]);
	const [filteredBots, setFilteredBots] = useState<BotApplication[]>([]);
	const [currentBot, setCurrentBot] = useState('');
	const [action, setAction] = useState<'approve' | 'deny'>('deny');
	const priority = ['pending', 'rejected', 'approved'];

	const openModal = (action: 'approve' | 'deny') => {
		setAction(action);
		onOpen();
	};

	useEffect(() => {
		axios.get('/api/bots').then(({ data }) => {
			setBots(data.data);
			setFilteredBots(data.data);
		});
	}, []);

	return (
		<>
			<Heading as={'h2'} fontSize={'xl'} color={'gray.400'}>
				{bots.filter(bot => bot.state === 'pending').length} bots pendiente(s)
			</Heading>
			<Input
				mt={5}
				placeholder={'Buscar bots'}
				value={query}
				onChange={e => {
					setQuery(e.target.value);
					setFilteredBots(
						bots.filter(
							bot =>
								bot.username
									.toLowerCase()
									.includes(e.target.value.toLowerCase()) ||
								bot.id == e.target.value
						)
					);
				}}
			/>
			<SimpleGrid p={5} spacing={5} columns={[1, 1, 2, 3, 3, 3, 4]}>
				{filteredBots
					.sort((x, y) => priority.indexOf(x.state) - priority.indexOf(y.state))
					.slice(0, 50)
					.map((b, i) => (
						<BotCard
							openModal={openModal}
							setCurrentBot={setCurrentBot}
							admin
							bot={b}
							key={i}
						/>
					))}
			</SimpleGrid>
			<ModalForm
				bot={bots.find(b => b.id == currentBot)!}
				action={action}
				isOpen={isOpen}
				onClose={onClose}
				setBots={setBots}
			/>
		</>
	);
}

function BansPanel() {
	const [query, setQuery] = useState('');
	const [bans, setBans] = useState<Ban[]>([]);
	const [filteredBans, setFilteredBans] = useState<Ban[]>([]);
	const [fetching, setFetching] = useState(false);
	const toast = useToast();

	useEffect(() => {
		axios.get('/api/bans').then(({ data }) => {
			setBans(data.data);
			setFilteredBans(data.data);
		});
	}, []);

	const banUser = () => {
		const snowflakeRegexp = /^\d{17,18}$/;
		if (!snowflakeRegexp.test(query)) {
			toast({
				title: 'Error',
				description: 'El ID de usuario no es válido',
				status: 'error',
				duration: 5000,
				isClosable: true
			});
			return;
		}

		setFetching(true);

		axios
			.get(`https://japi.rest/discord/v1/user/${query}`)
			.then(() => {
				axios
					.put(`/api/users/${query}/ban`)
					.then(() => {
						setFetching(false);
						toast({
							title: 'Éxito',
							description: 'Usuario baneado',
							status: 'success',
							duration: 5000,
							isClosable: true
						});

						setQuery('');
						axios.get('/api/bans').then(({ data }) => {
							setBans(data.data);
							setFilteredBans(
								data.data.filter(
									(ban: { username: string; id: string }) =>
										ban.username.toLowerCase().includes(query.toLowerCase()) ||
										ban.id == query
								)
							);
						});
					})
					.catch(err => {
						setQuery('');
						setFetching(false);
						toast({
							title: 'Error',
							description:
								err.response?.data.error ||
								err.message ||
								'Ha ocurrido un error al banear al usuario',
							status: 'error',
							duration: 5000,
							isClosable: true
						});
					});
			})
			.catch(() => {
				setQuery('');
				setFetching(false);
				toast({
					title: 'Error',
					description: 'El usuario no existe',
					status: 'error',
					duration: 5000,
					isClosable: true
				});
			});
	};

	const unbanUser = (ban: Ban) => {
		const snowflakeRegexp = /^\d{17,19}$/;
		if (!snowflakeRegexp.test(ban.id)) {
			toast({
				title: 'Error',
				description: 'El ID de usuario no es válido',
				status: 'error',
				duration: 5000,
				isClosable: true
			});
			return;
		}

		setFetching(true);

		axios
			.get(`https://japi.rest/discord/v1/user/${ban.id}`)
			.then(() => {
				axios
					.delete(`/api/users/${ban.id}/ban`)
					.then(() => {
						setFetching(false);
						toast({
							title: 'Éxito',
							description: 'Usuario desbaneado',
							status: 'success',
							duration: 5000,
							isClosable: true
						});

						setQuery('');
						axios.get('/api/bans').then(({ data }) => {
							setBans(data.data);
							setFilteredBans(
								data.data.filter(
									(ban: { username: string; id: string }) =>
										ban.username.toLowerCase().includes(query.toLowerCase()) ||
										ban.id == query
								)
							);
						});
					})
					.catch(err => {
						setQuery('');
						setFetching(false);
						toast({
							title: 'Error',
							description:
								err.response?.data.error ||
								err.message ||
								'Ha ocurrido un error al desbanear al usuario',
							status: 'error',
							duration: 5000,
							isClosable: true
						});
					});
			})
			.catch(() => {
				setQuery('');
				setFetching(false);
				toast({
					title: 'Error',
					description: 'El usuario no existe',
					status: 'error',
					duration: 5000,
					isClosable: true
				});
			});
	};

	return (
		<>
			<Heading as={'h2'} fontSize={'xl'} color={'gray.400'}>
				{bans.length} usuario(s) baneado(s)
			</Heading>

			<InputGroup mt={5}>
				<Input
					placeholder={'Buscar usuarios'}
					value={query}
					disabled={fetching}
					onChange={e => {
						setQuery(e.target.value);
						setFilteredBans(
							bans.filter(
								ban =>
									ban.username
										.toLowerCase()
										.includes(e.target.value.toLowerCase()) ||
									ban.id == e.target.value
							)
						);
					}}
				/>
				<InputRightElement width="4.5rem">
					<Button
						disabled={query.length < 1 || fetching}
						onClick={banUser}
						h="1.75rem"
						size="sm"
					>
						+
					</Button>
				</InputRightElement>
			</InputGroup>
			<Stack mt={5} spacing={5}>
				{filteredBans.map((ban, i) => (
					<Flex justify={'space-between'} align="center" gap={5} key={i}>
						<Flex align="center" gap={5} key={i}>
							<Avatar src={ban.avatar} />
							<Heading fontSize={'md'} as={'span'}>
								{ban.username}
							</Heading>
						</Flex>
						<Button
							onClick={() => unbanUser(ban)}
							disabled={fetching}
							colorScheme="red"
							variant="ghost"
						>
							<Icon v="s" id="user-slash" c="#ff4444" />
						</Button>
					</Flex>
				))}
			</Stack>
		</>
	);
}
