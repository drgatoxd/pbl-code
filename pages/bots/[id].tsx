/* eslint-disable react/no-children-prop */
import axios from 'axios';
import { connect } from '../../lib/database';
import { GetServerSidePropsContext } from 'next';
import { getSession, signIn, useSession } from 'next-auth/react';
import {
	Alert,
	AlertDescription,
	AlertIcon,
	Avatar,
	Button,
	Code,
	Container,
	Flex,
	FormLabel,
	Heading,
	Link,
	ModalBody,
	ModalCloseButton,
	ModalFooter,
	ModalOverlay,
	Progress,
	Stack,
	Tab,
	TabList,
	TabPanel,
	TabPanels,
	Tabs,
	Text,
	Textarea,
	useDisclosure,
	useToast
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import BotsModel, { type BotApplication } from '../../schemas/Bot';
import { DiscordUser } from '../api/auth/[...nextauth]';
import NotFound from '../404';
import Head from 'next/head';
import { Icon } from '../../components/icon';
import ReactMarkdown from 'react-markdown';
import { ExternalLinkIcon } from '@chakra-ui/icons';
import { Spinner } from '../../components/spinner';
import { staff } from '../../config';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { motion } from 'framer-motion';
import TextTransition from 'react-text-transition';
import { Modal, ModalContent, ModalHeader } from '../../components/Modal';

export default function Bot({
	bot: rawBot
}: {
	bot: BotApplication;
	props: unknown;
}) {
	const router = useRouter();

	const { data: session } = useSession();
	const profile = session?.profile as DiscordUser | undefined;
	const [bot, setBot] = useState(rawBot);
	const [guildCount, setGuildCount] = useState(0);
	const [server, setServer] = useState('');
	const [rate, setRate] = useState(0);
	const [owner, setOwner] = useState<{
		id: string;
		tag: string;
		avatarURL: string;
	}>();

	const [comment, setComment] = useState('');
	const [stars, setStars] = useState(0);
	const [hoveredStars, setHoverStars] = useState(0);
	const [fetching, setFetching] = useState(false);

	const { onOpen, onClose: closeModal, isOpen } = useDisclosure();
	const {
		onOpen: openReport,
		onClose: closeReport,
		isOpen: reportOpen
	} = useDisclosure();
	const [voting, setVoting] = useState(false);

	const toast = useToast();

	const onClose = () => {
		if (router.query.vote) {
			router.replace({
				query: { id: bot.id }
			});
		}
		closeModal();
	};

	useEffect(() => {
		if (!bot) return;
		setBot(rawBot);

		setRate(
			rawBot.comments.map(c => c.stars).reduce((a, b) => a + b, 0) /
				rawBot.comments.length || 0
		);

		const { vote } = router.query;

		if (vote == 'true') {
			onOpen();
		}

		axios.get(`https://japi.rest/discord/v1/application/${rawBot.id}`).then(
			({
				data: {
					data: {
						bot: { approximate_guild_count }
					}
				}
			}) => {
				setGuildCount(approximate_guild_count);
			}
		);

		axios.get(`/api/users/${rawBot.ownerId}`).then(({ data }) => {
			setOwner({
				id: data.data.id,
				tag: `${data.data.username}#${data.data.discriminator}`,
				avatarURL: `https://cdn.discordapp.com/avatars/${data.data.id}/${
					data.data.avatar
				}.${data.data.avatar.startsWith('a_') ? 'gif' : 'png'}`
			});
		});

		if (rawBot.supportServer) {
			axios
				.get(
					`https://discord.com/api/v10/invites/${new URL(
						rawBot.supportServer
					).pathname.slice(1)}`
				)
				.then(
					({
						data: {
							guild: { name }
						}
					}) => {
						setServer(name);
					}
				);
		}
	}, [rawBot]);

	const handleComment = () => {
		if (!profile) return;

		if (bot.comments.some(c => c.userId === profile.id)) {
			return toast({
				title: 'No puedes comentar',
				description: 'Ya publicaste una reseña.',
				status: 'error',
				variant: 'subtle',
				duration: 9000,
				isClosable: true
			});
		}

		setFetching(true);
		axios
			.post(`/api/bots/${bot.id}/comment`, {
				comment,
				stars
			})
			.then(() => {
				setFetching(false);
				setComment('');
				setStars(0);
				setBot(bot => ({
					...bot,
					comments: [
						...bot.comments,
						{
							stars,
							avatar: profile.avatar,
							content: comment,
							tag: `${profile?.username}#${profile?.discriminator}`,
							timestamp: Date.now(),
							userId: profile!.id
						}
					]
				}));
				toast({
					title: 'Comentario enviado',
					description: 'Tu comentario ha sido publicado con éxito',
					status: 'success',
					variant: 'subtle',
					duration: 9000,
					isClosable: true
				});
			})
			.catch(() => {
				setFetching(false);
				setComment('');
				setStars(0);

				toast({
					title: 'Ha ocurrido un error',
					description: 'No se pudo enviar tu comentario',
					status: 'error',
					variant: 'subtle',
					duration: 9000,
					isClosable: true
				});
			});
	};

	const handleVote = () => {
		if (!profile) return;

		if (
			(bot.votes.find(v => v.userId === profile.id)?.expires || 0) > Date.now()
		) {
			return toast({
				title: 'No puedes votar',
				description:
					'Ya has votado este bot. Espera unas horas para votar otra vez.',
				status: 'error',
				variant: 'subtle',
				duration: 9000,
				isClosable: true
			});
		}

		setVoting(true);
		axios
			.post(`/api/bots/${bot.id}/vote`, {
				vote: true
			})
			.then(() => {
				setBot(bot => ({
					...bot,
					votes: [
						...bot.votes,
						{
							userId: profile.id,
							expires: Date.now() + 1000 * 60 * 60 * 12
						}
					]
				}));
				toast({
					title: 'Voto enviado',
					description: 'Tu voto ha sido publicado con éxito',
					status: 'success',
					variant: 'subtle',
					duration: 9000,
					isClosable: true
				});

				setTimeout(() => {
					setVoting(false);
				}, 5000);
			})
			.catch(() => {
				setVoting(false);

				toast({
					title: 'Ha ocurrido un error',
					description: 'No se pudo enviar tu voto',
					status: 'error',
					variant: 'subtle',
					duration: 9000
				});
			});
	};

	if (!bot) return <NotFound />;

	return (
		<Container maxW="container.lg" my={5}>
			<Head>
				<title>{`${bot.username} - Pubertland BotList`}</title>
				<meta
					property="og:title"
					content={`¡Invita a ${bot.username} a tu servidor!`}
				/>
				<meta property="og:site_name" content="Pubertland BotList" />
				<meta property="og:type" content="website" />
				<meta property="og:description" content={bot.shortDescription} />
				<meta property="theme-color" content="#ff6640" />
				<meta property="og:image" content={bot.avatarURL} />
			</Head>
			<Stack
				key="bot-header"
				direction={['column', 'row']}
				align={['center']}
				spacing={5}
				justify={'space-between'}
			>
				<Stack direction={['column', 'row']} align="center" spacing={5}>
					<Avatar
						src={bot.avatarURL}
						name={bot.username}
						size="xl"
						bg="gray.900"
					/>
					<Stack spacing={1} textAlign={['center', 'center', 'left']}>
						<Heading noOfLines={1} as="h1" fontSize="4xl">
							{bot.username}
						</Heading>
						<Flex
							gap={5}
							px={2}
							fontSize="md"
							justify={['center', 'center', 'left']}
						>
							<Text>
								<Icon id="caret-up" m="Right" c="coral" />
								{bot.votes
									.filter(v => v.expires >= Date.now())
									.length.toLocaleString('en-US')}
							</Text>
							<Text>
								<Icon id="server" m="Right" c="coral" />
								{guildCount?.toLocaleString('en-US')}
							</Text>
						</Flex>
					</Stack>
				</Stack>
				<Stack align="center" direction="row">
					<Button colorScheme="red" as="a" href={bot.inviteURL}>
						Invitar
					</Button>
					<Button onClick={onOpen} disabled={bot.state !== 'approved'}>
						Votar
					</Button>
				</Stack>
			</Stack>
			<Tabs key="bot-details" my={5} colorScheme="orange">
				<TabList
					key="bot-details-tabs"
					justifyContent={['center', 'center', 'left']}
				>
					<Tab key="general-tag">General</Tab>
					<Tab key="info-tab">Información</Tab>
				</TabList>

				<TabPanels key="bot-details-panels">
					<TabPanel>
						<Stack spacing={5}>
							<ReactMarkdown
								key="md-overview"
								children={bot.longDescription}
								components={{
									h1({ children, ...props }) {
										return (
											<Heading {...props} as="h2" fontSize="5xl">
												{children}
											</Heading>
										);
									},
									h2({ children, ...props }) {
										return (
											<Heading {...props} as="h2" fontSize="3xl">
												{children}
											</Heading>
										);
									},
									a({ children, ...props }) {
										return (
											<Link {...props} isExternal color="orange.400">
												{children} <ExternalLinkIcon mx="2px" />
											</Link>
										);
									},
									p({ node, children, className, ...props }) {
										return (
											<Text className={className} {...props}>
												{children}
											</Text>
										);
									},
									code({ node, children, className, ...props }) {
										return <Code className={className}>{children}</Code>;
									}
								}}
							/>
						</Stack>
					</TabPanel>

					<TabPanel
						display={'flex'}
						flexDir={['column', 'column', 'row']}
						justifyContent="space-between"
						gap={10}
					>
						<Stack color="gray.300" key="details">
							<Heading color="white" fontSize="1.5rem">
								<Icon id="circle-info" s="1.4rem" c="salmon" m="Right" />{' '}
								Detalles
							</Heading>
							<Text fontSize="md" fontWeight="semibold">
								Prefix: <Code fontWeight={'normal'}>{bot.prefix}</Code>
							</Text>
							<Text fontSize="md" fontWeight="semibold">
								Servidores:{' '}
								<Code fontWeight={'normal'}>
									{guildCount?.toLocaleString('en-us')}
								</Code>
							</Text>
							<Text fontSize="md" fontWeight="semibold">
								Votos:{' '}
								<Code fontWeight={'normal'}>
									{bot.votes.length?.toLocaleString('en-us')}
								</Code>
							</Text>
						</Stack>
						<Stack color="gray.400" key="links">
							<Heading color="white" fontSize="1.5rem">
								<Icon
									id="up-right-from-square"
									s="1.4rem"
									c="salmon"
									m="Right"
								/>{' '}
								Enlaces
							</Heading>
							<Link key={'invite'} href={bot.inviteURL}>
								<Text>
									<Icon
										v="l"
										id="robot"
										s=".9rem"
										m="Right"
										c="var(--chakra-colors-gray-300)"
									/>
									Invitar bot
								</Text>
							</Link>
							{!!bot.websiteURL && (
								<Link key={'web'} href={bot.websiteURL}>
									<Text>
										<Icon
											v="l"
											id="link"
											s=".9rem"
											m="Right"
											c="var(--chakra-colors-gray-300)"
										/>
										{new URL(bot.websiteURL).hostname}
									</Text>
								</Link>
							)}
							{!!bot.githubURL && (
								<Link key={'gh'} href={bot.githubURL}>
									<Text>
										<Icon
											v="b"
											id="github"
											s=".9rem"
											m="Right"
											c="var(--chakra-colors-gray-300)"
										/>
										{new URL(bot.githubURL).pathname.slice(1)}
									</Text>
								</Link>
							)}
							{!!bot.supportServer && (
								<Link key={'sv'} href={bot.supportServer}>
									<Text>
										<Icon
											v="b"
											id="discord"
											s=".9rem"
											m="Right"
											c="var(--chakra-colors-gray-300)"
										/>
										{server}
									</Text>
								</Link>
							)}
							<Text color="red.300" cursor="pointer" onClick={openReport}>
								<Icon
									v="s"
									id="flag"
									s=".9rem"
									m="Right"
									c="var(--chakra-colors-red-300)"
								/>
								Reportar
							</Text>
						</Stack>
						<Stack color="gray.400" key="owners">
							<Heading color="white" fontSize="1.5rem">
								<Icon id="user" s="1.4rem" c="salmon" m="Right" /> Propietarios
							</Heading>
							<Stack spacing={3}>
								{[owner, ...bot.coOwners].map((owner, i) => (
									<NextLink key={i} href={`/u/${owner?.id}`}>
										<Flex gap={2} cursor="pointer">
											<Avatar src={owner?.avatarURL} size="xs" />
											<Text fontSize="md">{owner?.tag}</Text>
										</Flex>
									</NextLink>
								))}
							</Stack>
						</Stack>
					</TabPanel>
				</TabPanels>
			</Tabs>
			<Heading
				textAlign={['center', 'center', 'left']}
				as="h3"
				fontSize={'2xl'}
				mt={5}
			>
				Calificaciones y Reseñas
			</Heading>
			<Flex
				flexDir={['column', 'column', 'row']}
				justify={'space-between'}
				align="center"
				w="full"
				mb={5}
			>
				<Flex
					gap={5}
					align="center"
					justify={'center'}
					flexDir={['column', 'row']}
				>
					<Heading fontSize="7xl">{rate.toFixed(2)}</Heading>
					<Stack align="center" justify="center">
						<Stack direction="row">
							{Array.from({ length: 5 }).map((_, i) => (
								<Icon
									key={`stars-${i}`}
									c="salmon"
									id={
										i + 1 > rate &&
										i + 1 <= Math.round(rate) &&
										!Number.isInteger(rate)
											? 'star-sharp-half-stroke'
											: 'star'
									}
									v={rate > i ? 's' : 'l'}
								/>
							))}
						</Stack>
						<Text>{bot.comments.length} comentarios</Text>
					</Stack>
				</Flex>
				<Flex
					w="full"
					align={['center', 'flex-end']}
					justify="center"
					flexDir="column"
					p={4}
				>
					{Array.from({ length: 5 }).map((_, i, arr) => (
						<Flex
							justifyContent={['center', 'center', 'flex-end']}
							w="full"
							key={i}
							gap={5}
							align="center"
						>
							<Text as="span" minW="40px">
								{(arr.length - i).toString()}{' '}
								<Icon
									c="var(--chakra-colors-orange-300)"
									id="star"
									v={'l'}
									m="Left"
								/>
							</Text>
							<Progress
								value={
									rawBot.comments.length
										? percentage(
												rawBot.comments.filter(c => c.stars == arr.length - i)
													.length,
												rawBot.comments.length
										  )
										: 0
								}
								size="xs"
								w={'250px'}
								colorScheme="orange"
								rounded="full"
							/>
							<Text as="span">
								{bot.comments.filter(c => c.stars == arr.length - i).length}
							</Text>
						</Flex>
					))}
				</Flex>
			</Flex>
			<Stack px={5}>
				{bot.state !== 'approved' ? (
					<Alert status="warning" mb={8}>
						<AlertIcon />
						<AlertDescription>
							El bot no ha sido aprobado por el administrador.
						</AlertDescription>
					</Alert>
				) : !!profile ? (
					<>
						<Flex gap={5}>
							<Avatar src={profile.avatar} name={profile.username} />
							<Stack w="full">
								<Text fontSize="xl" noOfLines={1}>
									{profile.username}
								</Text>
								<Stack direction="row">
									{Array.from({ length: 5 }).map((_, i) => (
										<Icon
											key={i}
											c="salmon"
											id="star"
											v={hoveredStars > i || stars > i ? 's' : 'l'}
											cursor={'pointer'}
											onMouseEnter={() => setHoverStars(i + 1)}
											onMouseLeave={() => setHoverStars(0)}
											onClick={() => setStars(i + 1)}
										/>
									))}
								</Stack>
								<Textarea
									value={comment}
									focusBorderColor={'orange.300'}
									onChange={e => setComment(e.target.value)}
									placeholder={'Escribe un comentario...'}
									maxLength={2048}
								/>
							</Stack>
						</Flex>
						<Flex mb={5} justify={'flex-end'}>
							<Button
								disabled={fetching || !stars || !comment.length}
								onClick={handleComment}
							>
								{fetching ? <Spinner /> : 'Publicar'}
							</Button>
						</Flex>
					</>
				) : (
					<Alert status="info" mb={8}>
						<AlertIcon />
						<AlertDescription>
							Inicia sesión para compartir tu opinión.
						</AlertDescription>
					</Alert>
				)}

				<Stack spacing={5}>
					{bot.comments.map((c, i) => (
						<Stack key={i}>
							<Flex gap={5}>
								<Avatar src={c.avatar} name={c.tag} />
								<Stack w="full">
									<Text fontSize="xl" noOfLines={1}>
										{c.tag}
									</Text>
									<Stack direction="row">
										{Array.from({ length: 5 }).map((_, i) => (
											<Icon
												key={i}
												c="salmon"
												id={'star'}
												v={c.stars > i ? 's' : 'l'}
											/>
										))}
									</Stack>
									<Text>{c.content}</Text>
								</Stack>
							</Flex>
						</Stack>
					))}
				</Stack>
			</Stack>

			<Modal
				closeOnEsc={!voting}
				closeOnOverlayClick={!voting}
				isOpen={isOpen}
				onClose={onClose}
				isCentered
				motionPreset="slideInBottom"
			>
				<ModalOverlay />
				<ModalContent bg="gray.900">
					<ModalHeader
						title={
							profile ? `¿Deseas votar por ${bot.username}?` : '¡Oh no! 😰'
						}
					/>
					<ModalCloseButton />
					<ModalBody>
						{profile
							? bot.votes.some(
									v => v.userId == profile.id && v.expires >= Date.now()
							  )
								? `Espera unas horas para votar de nuevo.`
								: 'Solo puedes votar una vez cada 12 horas.'
							: 'Inicia sesión para poder votar.'}
					</ModalBody>

					<ModalFooter>
						<Button
							colorScheme="red"
							variant="ghost"
							mr={3}
							onClick={onClose}
							disabled={voting}
						>
							Salir
						</Button>
						{profile ? (
							<Button
								variant="ghost"
								disabled={
									voting ||
									(bot.votes.find(v => v.userId === profile.id)?.expires || 0) >
										Date.now()
								}
								onClick={handleVote}
							>
								{voting ? <Spinner /> : 'Votar'}
							</Button>
						) : (
							<Button
								variant="ghost"
								disabled={profile ? !voting : false}
								onClick={() => void signIn('discord')}
							>
								Acceder
							</Button>
						)}
					</ModalFooter>
				</ModalContent>
			</Modal>

			<ReportModal
				isReportOpen={reportOpen}
				openReport={openReport}
				closeReport={closeReport}
				profile={profile}
				bot={rawBot}
			/>
		</Container>
	);
}

function ReportModal({
	isReportOpen,
	openReport,
	closeReport,
	profile,
	bot
}: {
	isReportOpen: boolean;
	openReport: () => void;
	closeReport: () => void;
	profile: DiscordUser | undefined;
	bot: BotApplication;
}) {
	const [step, setStep] = useState(0);
	const [sending, setSending] = useState(false);
	const [topic, setTopic] = useState('');
	const ref = useRef<HTMLTextAreaElement>(null);

	const close = () => {
		closeReport();
		setStep(0);
		setTopic('');
	};

	const toast = useToast();

	const handleReport = () => {
		if (!profile) return;

		if ((ref.current?.value?.length || 0) < 10) {
			toast({
				title: 'Error',
				description: 'El reporte debe tener al menos 10 caracteres',
				status: 'error',
				duration: 5000,
				isClosable: true
			});
			return;
		}

		setSending(true);

		setTimeout(() => {
			axios
				.post(`/api/bots/${bot.id}/report`, {
					topic,
					reason: ref.current?.value || 'Unknown value'
				})
				.then(() => {
					setSending(false);
					close();
					toast({
						title: 'Reporte enviado',
						description: 'El reporte ha sido enviado correctamente.',
						status: 'success',
						duration: 5000,
						isClosable: true
					});
				});
		}, 1000);
	};

	const sections = {
		1: (
			<>
				<FormLabel>Escribe tu reporte:</FormLabel>
				<Textarea rows={7} maxLength={4000} ref={ref} disabled={sending} />
			</>
		),
		0: (
			<Stack spacing={0}>
				<Stack
					direction={'row'}
					justify="space-between"
					p={3}
					rounded={'2xl'}
					transition={'all .1s cubic-bezier(0, 0, 0.2, 1)'}
					_hover={{ bg: 'whiteAlpha.300' }}
					cursor={'pointer'}
					onClick={() => {
						setStep(1);
						setTopic('Contenido NSFW');
					}}
				>
					<Text>Contenido NSFW</Text>
				</Stack>
				<Stack
					direction={'row'}
					justify="space-between"
					p={3}
					rounded={'2xl'}
					transition={'all .1s cubic-bezier(0, 0, 0.2, 1)'}
					_hover={{ bg: 'whiteAlpha.300' }}
					cursor={'pointer'}
					onClick={() => {
						setStep(1);
						setTopic('Abuso del API');
					}}
				>
					<Text>Abuso del API</Text>
				</Stack>
				<Stack
					direction={'row'}
					justify="space-between"
					p={3}
					rounded={'2xl'}
					transition={'all .1s cubic-bezier(0, 0, 0.2, 1)'}
					_hover={{ bg: 'whiteAlpha.300' }}
					cursor={'pointer'}
					onClick={() => {
						setStep(1);
						setTopic('Fraude o Scam');
					}}
				>
					<Text>Fraude o Scam</Text>
				</Stack>
				<Stack
					direction={'row'}
					justify="space-between"
					p={3}
					rounded={'2xl'}
					transition={'all .1s cubic-bezier(0, 0, 0.2, 1)'}
					_hover={{ bg: 'whiteAlpha.300' }}
					cursor={'pointer'}
					onClick={() => {
						setStep(1);
						setTopic('Es una copia');
					}}
				>
					<Text>Es una copia</Text>
				</Stack>
				<Stack
					direction={'row'}
					justify="space-between"
					p={3}
					rounded={'2xl'}
					transition={'all .1s cubic-bezier(0, 0, 0.2, 1)'}
					_hover={{ bg: 'whiteAlpha.300' }}
					cursor={'pointer'}
					onClick={() => {
						setStep(1);
						setTopic('No funciona');
					}}
				>
					<Text>No funciona</Text>
				</Stack>
			</Stack>
		)
	};

	return (
		<Modal
			closeOnEsc={!sending}
			closeOnOverlayClick={!sending}
			isOpen={isReportOpen}
			onClose={close}
			isCentered
			motionPreset="slideInBottom"
			size="xl"
		>
			<ModalOverlay />
			<ModalContent
				bg="gray.900"
				as={motion.section}
				layout="position"
				// @ts-ignore
				transition={{
					layout: { duration: 0.05 },
					scale: { ease: 'cubic-bezier(0, 0, 0.2, 1)' }
				}}
			>
				<ModalHeader
					title={
						profile
							? sending
								? 'Enviando...'
								: step == 0
								? `Reportar a ${bot.tag}`
								: topic
							: '¡Oh no! 😰'
					}
					subtitle={
						profile
							? step == 0
								? `Selecciona el motivo del reporte`
								: 'Escribe información detallada'
							: ''
					}
					transitionDir={sending ? 'up' : step == 0 ? 'up' : 'down'}
					withAnimation
				/>

				<ModalCloseButton />
				<ModalBody transition={'.2s ease'}>
					{profile
						? sections[`${step as 0 | 1}`]
						: 'Inicia sesión para continuar.'}
				</ModalBody>

				<ModalFooter>
					<Button
						colorScheme="red"
						variant="ghost"
						mr={3}
						onClick={() => {
							if (step == 1) {
								setStep(0);
								setTopic('');
							} else closeReport();
						}}
						disabled={sending}
					>
						{step == 1 ? 'Volver' : 'Salir'}
					</Button>
					{profile ? (
						<Button
							variant="ghost"
							disabled={sending || !topic.length}
							onClick={() => (step == 0 ? setStep(1) : handleReport())}
						>
							{sending ? <Spinner /> : 'Enviar reporte'}
						</Button>
					) : (
						<Button
							variant="ghost"
							disabled={profile ? !sending : false}
							onClick={() => void signIn('discord')}
						>
							Acceder
						</Button>
					)}
				</ModalFooter>
			</ModalContent>
		</Modal>
	);
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
	const session = await getSession({ req: ctx.req });
	await connect();

	const query: { id: string; state?: 'approved' | 'pending' | 'rejected' } = {
		id: ctx.query.id as string,
		state: 'approved'
	};

	if (session) {
		delete query.state;
	}

	const bot = await BotsModel.findOne(query);
	if (!bot)
		return {
			notFound: true
		};
	if (
		bot.state != 'approved' &&
		bot.ownerId != (session!['profile'] as DiscordUser).id &&
		!bot.coOwners.some(c => c.id == (session!['profile'] as DiscordUser).id) &&
		!staff.includes((session!['profile'] as DiscordUser).id)
	) {
		return {
			notFound: true
		};
	}

	return { props: { bot: JSON.parse(JSON.stringify(bot)) } };
}

function percentage(partialValue: number, totalValue: number) {
	return (100 * partialValue) / totalValue;
}
