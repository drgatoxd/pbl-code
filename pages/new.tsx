import { ChangeEvent, useEffect, useState } from 'react';
import { DiscordUser } from './api/auth/[...nextauth]';
import axios from 'axios';
import { getSession, signIn, useSession } from 'next-auth/react';
import { Step, Steps, useSteps } from 'chakra-ui-steps';
import {
	Avatar,
	Box,
	Button,
	Container,
	Flex,
	Heading,
	Input,
	InputGroup,
	InputLeftAddon,
	InputRightElement,
	Menu,
	MenuButton,
	MenuItemOption,
	MenuList,
	MenuOptionGroup,
	SimpleGrid,
	SlideFade,
	Stack,
	Tag,
	TagCloseButton,
	TagLabel,
	Text,
	Textarea,
	useToast,
	Wrap
} from '@chakra-ui/react';
import { Spinner } from '../components/spinner';
import { tags as configTags } from '../config';
import { Link } from '../components/link';
import type { BotApplication } from '../schemas/Bot';
import Head from 'next/head';
import { GetServerSidePropsContext } from 'next';

const steps = [
	{ label: 'Buscar Bot', Content: BotIdForm },
	{ label: 'Detalles', Content: BotOverview },
	{ label: 'Conexiones', Content: BotConnections },
	{ label: 'Descripción', Content: BotDescription }
];

export default function AddBot({ tags }: { tags: string[] }) {
	const [profile, setProfile] = useState<DiscordUser>();
	const [form, setForm] = useState<BotApplication>();
	const [disabled, setDisabled] = useState(true);
	const [fetching, setFetching] = useState(false);
	const [success, setSuccess] = useState(false);
	const { nextStep, activeStep, setStep, prevStep } = useSteps({
		initialStep: 0
	});

	const toast = useToast();

	useEffect(() => {
		axios.get('/api/users/@me').then(({ data }) => {
			if (!data?.['profile']?.id)
				return void signIn('discord', { redirect: true });
			setProfile(data.profile);
		});
	}, []);

	const submitBot = () => {
		setFetching(true);
		setSuccess(true);
		axios
			.post('/api/bots', { ...form, state: '' })
			.then(({ data }) => {
				if (data.success) {
					setFetching(false);
					nextStep();
				} else {
					setFetching(false);
					setSuccess(false);
					toast({
						title: 'Error',
						description: data.error,
						status: 'error',
						variant: 'subtle'
					});
				}
			})
			.catch(err => {
				setFetching(false);
				setSuccess(false);
				toast({
					title: 'Error',
					description: err.response?.error || err.message,
					status: 'error',
					variant: 'subtle'
				});
			});
	};

	return (
		<Container maxW={'container.lg'} flexDir="column" mt={10}>
			<Head>
				<title>Nuevo bot - Pubertland BotList</title>
			</Head>
			<Bot
				success={success}
				botData={form}
				setStep={setStep}
				setForm={setForm}
			/>
			<Steps colorScheme={'orange'} activeStep={activeStep}>
				{steps.map(({ label, Content }) => (
					<Step label={label} key={label}>
						<Content
							setDisabled={setDisabled}
							setFetching={setFetching}
							setForm={setForm}
							tags={tags}
							profile={profile!}
							form={form!}
						/>
					</Step>
				))}
			</Steps>
			{activeStep === steps.length ? (
				<Heading
					fontWeight={'normal'}
					textAlign={'center'}
					fontSize={'lg'}
					my={10}
				>
					¡Terminaste! Únete al servidor para las notificaciones de tu bot
					<SlideFade in>
						<Link href={'/'}>
							<Button mt={3}>Ir al inicio</Button>
						</Link>
					</SlideFade>
				</Heading>
			) : (
				<Flex gap={2} width="100%" justify="flex-end" mb={5}>
					<Button
						disabled={fetching || activeStep == 0}
						size="sm"
						onClick={() => prevStep()}
					>
						Volver
					</Button>
					<Button
						disabled={disabled || fetching}
						size="sm"
						onClick={() => {
							if (activeStep === steps.length - 1) {
								submitBot();
							} else {
								nextStep();
							}
						}}
					>
						{fetching ? (
							<Spinner />
						) : activeStep === steps.length - 1 ? (
							'Terminar'
						) : (
							'Siguiente'
						)}
					</Button>
				</Flex>
			)}
		</Container>
	);
}

function Bot({
	botData,
	setStep,
	setForm,
	success
}: {
	botData?: BotApplication;
	setStep: (step: number) => void;
	setForm: (form: BotApplication) => void;
	success: boolean;
}) {
	return !botData ? (
		<Heading my={10}>Agregar bot</Heading>
	) : (
		<Flex
			flexDir={['column', 'row']}
			gap={5}
			width="100%"
			justify="space-between"
			align="center"
			my={10}
		>
			<Flex gap={5} width="100%" justify="flex-start" align="center">
				<Avatar
					bg={'gray.900'}
					color={'white'}
					size={'lg'}
					src={botData.avatarURL}
					name={botData.tag}
				/>
				<Flex flexDir={'column'}>
					<Heading maxW={'65vw'} noOfLines={1}>
						{botData.tag}
					</Heading>
					<Text>{botData.guildCount.toLocaleString('en-us')} servidores</Text>
				</Flex>
			</Flex>
			<Button
				disabled={success}
				onClick={() => {
					if (success) return;
					setStep(0);
					setForm(undefined!);
				}}
			>
				Cambiar bot
			</Button>
		</Flex>
	);
}

function BotIdForm({
	setForm,
	setDisabled,
	setFetching,
	form,
	profile
}: {
	setForm: (
		form:
			| BotApplication
			| ((prev: BotApplication | undefined) => BotApplication | undefined)
	) => void;
	setDisabled: (disabled: boolean) => void;
	setFetching: (fetching: boolean) => void;
	form: BotApplication;
	profile: DiscordUser;
}) {
	const [botId, setBotId] = useState(form?.id || '');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const { data: session } = useSession();
	const user = session?.profile as DiscordUser | undefined;

	const fetchBot = () => {
		if (!botId?.length) return setMessage('Ingresa la ID de tu bot');
		const snowflakeRegex = /^\d{17,19}$/;
		if (!snowflakeRegex.test(botId)) return setMessage('Ingresa una ID válida');

		setMessage('');
		setFetching(true);
		setLoading(true);

		axios
			.get(`/api/bots/${botId}`)
			.then(({ data }) => {
				setBotId('');
				setMessage(
					`El bot ya está registrado. ${
						data.data.ownerId == profile.id
							? data.data.state == 'rejected'
								? 'Si quieres re-enviar tu bot, ve a tu perfil.'
								: data.data.state == 'pending'
								? 'Espera la aprobación en el servidor de soporte.'
								: ''
							: ''
					}`
				);
				setLoading(false);
				setFetching(false);
				return;
			})
			.catch(() => {
				axios
					.get(`https://japi.rest/discord/v1/application/${botId}`)
					.then(({ data }) => {
						if (!data.data.application.bot_public) {
							setMessage('El bot no es público');
							setLoading(false);
							setFetching(false);
							return;
						}
						setFetching(false);
						setDisabled(false);
						setLoading(false);

						// @ts-ignore
						setForm((prev: Partial<BotApplication>) => ({
							...prev,
							username: data.data.bot.username,
							avatarURL:
								data.data.bot.avatarURL || data.data.bot.defaultAvatarURL,
							guildCount: data.data.bot.approximate_guild_count || 0,
							tag: data.data.bot.tag,
							ownerId: user!.id,
							id: data.data.bot.id,
							discriminator: data.data.bot.discriminator,
							shortDescription: data.data.application.description,
							verified:
								data.data.bot.public_flags_array.includes('VERIFIED_BOT')
						}));
					})
					.catch(() => {
						setLoading(false);
						setDisabled(true);
						setFetching(false);
						setMessage('No existe una aplicación con esa ID');
					});
			});
	};

	useEffect(() => {
		if (form?.id == botId) {
			setDisabled(false);
		}
	}, []);

	return (
		<Container my={5}>
			<Text textAlign={'left'} mb="8px">
				Ingresa la ID de tu bot
			</Text>
			<Flex gap={3} align={'center'}>
				<Input
					value={botId}
					focusBorderColor="orange.400"
					onChange={e => {
						setBotId(e.target.value);
					}}
					placeholder="960194722947813386"
					size="sm"
				/>
				<Button
					onClick={fetchBot}
					disabled={loading || botId == form?.id || !botId.length}
				>
					Enviar
				</Button>
			</Flex>
			<Text fontSize={'sm'} textAlign={'left'} color={'orange.400'}>
				{message}
			</Text>
		</Container>
	);
}

function BotOverview({
	setForm,
	setDisabled,
	setFetching,
	tags,
	profile,
	form
}: {
	setForm: (
		form:
			| BotApplication
			| ((prev: BotApplication | undefined) => BotApplication | undefined)
	) => void;
	setDisabled: (disabled: boolean) => void;
	setFetching: (fetching: boolean) => void;
	tags: string[];
	profile: DiscordUser;
	form: BotApplication;
}) {
	const [prefix, setPrefix] = useState(form.prefix || '');
	const [botTags, setBotTags] = useState<string[]>(form.tags || []);
	const [currentId, setCurrentId] = useState('');
	const [message, setMessage] = useState('');
	const [coOwners, setCoOwners] = useState<
		Array<{
			id: string;
			tag: string;
			avatarURL: string;
		}>
	>(form.coOwners || []);

	useEffect(() => {
		if (!prefix.length || !botTags.length) setDisabled(true);
		else {
			setForm((prev: BotApplication | undefined) => ({
				...prev!,
				prefix,
				tags: botTags,
				coOwners
			}));
			setDisabled(false);
		}
	}, [prefix, botTags, coOwners]);

	useEffect(() => {
		setForm(prev => ({ ...(prev as any), tags: botTags }));
	}, [botTags]);

	const fetchUser = () => {
		if (coOwners.length == 5) {
			return setMessage('No puedes tener más de 5 co-owners');
		}

		if (coOwners.some(x => x.id == currentId)) {
			return setMessage('El usuario ya está en la lista');
		}

		if (currentId == profile.id) {
			return setMessage('No puedes agregarte a ti mismo');
		}

		setFetching(true);
		setCurrentId('');
		axios
			.get(`https://japi.rest/discord/v1/user/${currentId}`)
			.then(({ data }) => {
				setFetching(false);
				if (data.data.bot) {
					return setMessage('No puedes agregar bots.');
				}

				setMessage('');
				setCoOwners([
					...coOwners,
					{
						id: data.data.id,
						tag: data.data.tag,
						avatarURL: data.data.avatarURL
					}
				]);
			})
			.catch(() => {
				setFetching(false);
				return setMessage('El usuario no es válido.');
			});
	};

	const removeUser = (id: string) => {
		setCoOwners(coOwners.filter(user => user.id !== id));
	};

	return (
		<Stack spacing={10} maxW={'container.lg'} my={5}>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Prefix
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						La palabra clave que usarás para interactuar con tu bot.
					</Text>
				</Flex>
				<Input
					alignSelf={'center'}
					w={'100%'}
					value={prefix}
					focusBorderColor="orange.400"
					onChange={e => {
						setPrefix(e.target.value);
					}}
					placeholder="!"
					size="sm"
					maxLength={10}
				/>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Etiquetas
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Permite a los usuarios encontrar tu bot fácilmente.
					</Text>
				</Flex>
				<Box w={'100%'}>
					<TagList tags={tags} setTags={setBotTags} currentTags={botTags} />
					<Wrap mt={2}>
						{botTags.map((t, i) => (
							<Tag key={i}>{t}</Tag>
						))}
					</Wrap>
				</Box>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Co-Propietarios
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Escribe las IDs de los co-propietarios del bot.
					</Text>
				</Flex>
				<Box w={'100%'}>
					<InputGroup>
						<Input
							alignSelf={'center'}
							w={'100%'}
							h={10}
							value={currentId}
							focusBorderColor="orange.400"
							onChange={e => {
								setCurrentId(e.target.value);
							}}
							placeholder="883105651407077386"
							size="sm"
							maxLength={19}
							pr="4.5rem"
						/>
						<InputRightElement width="4.5rem">
							<Button
								disabled={currentId.length < 1}
								onClick={fetchUser}
								h="1.75rem"
								size="sm"
							>
								+
							</Button>
						</InputRightElement>
					</InputGroup>
					<Text color={'orange.400'} size={'sm'}>
						{message}
					</Text>
					<Wrap mt={2}>
						{coOwners.map((t, i) => (
							<Tag size="lg" borderRadius="full" key={i} colorScheme={'orange'}>
								<Avatar
									bg={'gray.700'}
									src={t.avatarURL}
									size="xs"
									name={t.tag}
									ml={-1}
									mr={2}
								/>
								<TagLabel>{t.tag}</TagLabel>
								<TagCloseButton onClick={() => removeUser(t.id)} />
							</Tag>
						))}
					</Wrap>
				</Box>
			</SimpleGrid>
		</Stack>
	);
}

function TagList({
	tags,
	setTags,
	currentTags
}: {
	tags: string[];
	setTags: (tags: string[] | ((prevTags: string[]) => string[])) => void;
	currentTags: string[];
}) {
	const [localTags, setLocalTags] = useState(currentTags || []);

	useEffect(() => {
		setTags(localTags);
	}, [localTags]);

	const handleOnChange = (label: string) => {
		setLocalTags(prev => {
			if (prev.includes(label)) {
				return prev.filter(t => t !== label);
			} else {
				return [...prev, label];
			}
		});
	};

	return (
		<Menu>
			<MenuButton as={Button} w={'100%'} textAlign={'left'}>
				<Text as={'span'} color={'salmon'} fontSize={'xl'} mr={1}>
					#
				</Text>
				Seleccionar etiquetas
			</MenuButton>
			<MenuList bg="gray.900" maxH={'250px'} overflowY={'scroll'}>
				{tags.map((t, i) => (
					<MenuOptionGroup key={i} type={'checkbox'} defaultValue={localTags}>
						<MenuItemOption
							type={'checkbox'}
							closeOnSelect={false}
							onClick={() => handleOnChange(t)}
							value={t}
						>
							{t}
						</MenuItemOption>
					</MenuOptionGroup>
				))}
			</MenuList>
		</Menu>
	);
}

function BotConnections({
	setForm,
	setDisabled,
	form
}: {
	setForm: (
		form:
			| BotApplication
			| ((prev: BotApplication | undefined) => BotApplication | undefined)
	) => void;
	setDisabled: (disabled: boolean) => void;
	form: BotApplication;
}) {
	const [inviteURL, setInviteURL] = useState(form.inviteURL || '');
	const [ghURL, setGhURL] = useState(
		form.githubURL?.split('/')?.slice(3).join('/') || ''
	);
	const [dscURL, setDscURL] = useState(
		form.supportServer?.split('/')?.[3] || ''
	);
	const [webURL, setWebURL] = useState(form.websiteURL || '');

	useEffect(() => {
		if (!inviteURL.startsWith('https://discord.com/oauth2/authorize?')) {
			setDisabled(true);
			setForm(prev => ({ ...(prev as any), inviteURL: '' }));
		} else {
			setDisabled(false);
			setForm(prev => ({ ...(prev as any), inviteURL: inviteURL }));
		}
	}, [inviteURL]);

	useEffect(() => {
		setForm(prev => ({
			...(prev as any),
			githubURL: ghURL.length ? `https://github.com/${ghURL}` : undefined
		}));
	}, [ghURL]);

	useEffect(() => {
		setForm(prev => ({
			...(prev as any),
			supportServer: dscURL.length ? `https://discord.gg/${dscURL}` : undefined
		}));
	}, [dscURL]);

	useEffect(() => {
		setForm(prev => ({
			...(prev as any),
			websiteURL: webURL.length ? webURL : undefined
		}));
	}, [webURL]);

	const generateInvite = () => {
		setInviteURL(
			`https://discord.com/oauth2/authorize?client_id=${form.id}&scope=bot+applications.commands&permissions=8`
		);
	};

	return (
		<Stack spacing={10} maxW={'container.lg'} my={5}>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Invitación
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Enlace de invitación para el bot.
					</Text>
				</Flex>
				<InputGroup>
					<Input
						alignSelf={'center'}
						w={'100%'}
						h={10}
						value={inviteURL}
						focusBorderColor="orange.400"
						onChange={e => {
							setInviteURL(e.target.value);
						}}
						isInvalid={
							inviteURL.length > 0 &&
							!inviteURL.startsWith('https://discord.com/oauth2/authorize?')
						}
						placeholder="https://discord.com/oauth2/authorize?client_id=1234567890&scope=bot+applications.commands"
						size="sm"
						pr="5rem"
					/>
					<InputRightElement width="4.5rem">
						<Button
							disabled={inviteURL.startsWith(
								'https://discord.com/oauth2/authorize?'
							)}
							onClick={generateInvite}
							h="1.75rem"
							size="sm"
							mr={2}
						>
							Generar
						</Button>
					</InputRightElement>
				</InputGroup>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Sitio Web
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Una página web donde puedes mostrar información, documentación, etc.
					</Text>
				</Flex>
				<Input
					maxLength={200}
					focusBorderColor={'orange.400'}
					placeholder="https://pubertland.pe"
					value={webURL}
					onChange={e => setWebURL(e.target.value)}
				/>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Código fuente
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Si tu bot es de código abierto, comparte el enlace del repositorio.
					</Text>
				</Flex>
				<InputGroup>
					<InputLeftAddon>github.com/</InputLeftAddon>
					<Input
						maxLength={250}
						focusBorderColor={'orange.400'}
						placeholder="drgatoxd/meong-bot"
						value={ghURL}
						onChange={e => setGhURL(e.target.value)}
					/>
				</InputGroup>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Servidor de soporte
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Un lugar donde los usuarios puedan pedir ayuda.
					</Text>
				</Flex>
				<InputGroup>
					<InputLeftAddon>discord.gg/</InputLeftAddon>
					<Input
						maxLength={25}
						focusBorderColor={'orange.400'}
						placeholder="wumpus"
						value={dscURL}
						onChange={e => setDscURL(e.target.value)}
					/>
				</InputGroup>
			</SimpleGrid>
		</Stack>
	);
}

function BotDescription({
	setForm,
	setDisabled,
	form
}: {
	form: BotApplication;
	setForm: (
		form:
			| BotApplication
			| ((prev: BotApplication | undefined) => BotApplication | undefined)
	) => void;
	setDisabled: (disabled: boolean) => void;
}) {
	const [shortDescription, setShortDescription] = useState('');
	const [longDescription, setLongDescription] = useState('');

	useEffect(() => {
		setShortDescription(form.shortDescription);
	}, []);

	useEffect(() => {
		setForm(prev => ({ ...(prev as any), shortDescription, longDescription }));

		if (shortDescription.length < 25 || longDescription.length < 150) {
			setDisabled(true);
		} else {
			setDisabled(false);
		}
	}, [shortDescription, longDescription]);

	return (
		<Stack spacing={10} maxW={'container.lg'} my={5}>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Descripción corta
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Una breve descripción del bot de al menos 25 caracteres.
					</Text>
				</Flex>
				<Input
					alignSelf={'center'}
					w={'100%'}
					value={shortDescription}
					focusBorderColor="orange.400"
					onChange={e => {
						setShortDescription(e.target.value);
					}}
					placeholder="Soy un bot cool..."
					size="sm"
					maxLength={150}
				/>
			</SimpleGrid>
			<SimpleGrid spacing={5} w={'100%'} minChildWidth="210px">
				<Flex flexDir={'column'} align={'left'}>
					<Heading
						as={'span'}
						fontSize={'lg'}
						fontWeight={'semibold'}
						textAlign={'left'}
					>
						Descripción detallada
					</Heading>
					<Text color={'gray.400'} textAlign={'left'} fontSize={'sm'}>
						Cuéntanos todo acerca de tu bot. Puedes usar Markdown. (min. 150
						caracteres)
					</Text>
				</Flex>
				<Textarea
					alignSelf={'center'}
					w={'100%'}
					value={longDescription}
					focusBorderColor="orange.400"
					onChange={e => {
						setLongDescription(e.target.value);
					}}
					placeholder="En un pueblo italiano, al pie de las montañas, vive nuestro amigo ..."
					size="sm"
					maxLength={6000}
				/>
			</SimpleGrid>
		</Stack>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const session = await getSession({ req: ctx.req });

	if (!session?.profile) {
		return {
			redirect: {
				permanent: false,
				destination: '/'
			},
			props: {}
		};
	}

	return { props: { tags: configTags } };
}

// https://japi.rest/discord/v1/application/960194722947813386
