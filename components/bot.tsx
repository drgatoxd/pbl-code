import { BotApplication } from '../schemas/Bot';
import {
	Avatar,
	Box,
	Button,
	Drawer,
	DrawerBody,
	DrawerCloseButton,
	DrawerContent,
	DrawerFooter,
	DrawerHeader,
	DrawerOverlay,
	Flex,
	FormLabel,
	Heading,
	HStack,
	IconButton,
	ListItem,
	Menu,
	MenuButton,
	MenuItem,
	MenuList,
	ModalBody,
	ModalCloseButton,
	ModalFooter,
	ModalOverlay,
	Stack,
	Tag,
	Text,
	Textarea,
	UnorderedList,
	useDisclosure,
	useToast
} from '@chakra-ui/react';
import { TagButton as TagLink } from './tag';
import { Icon } from './icon';
import { useRouter } from 'next/router';
import { Link } from './link';
import axios from 'axios';
import { useState } from 'react';
import { Modal, ModalContent, ModalHeader } from './Modal';

export function BotCard({
	bot,
	admin,
	setBots,
	setCurrentBot,
	openModal,
	itsMyBot,
	zIndex,
	dontDisplayBadge
}: {
	bot: BotApplication;
	admin?: boolean;
	setCurrentBot?: (bot: string) => void;
	setBots?: (
		bot: BotApplication[] | ((prev: BotApplication[]) => BotApplication[])
	) => void;
	openModal?: (type: 'approve' | 'deny') => void;
	itsMyBot?: boolean;
	zIndex?: number;
	dontDisplayBadge?: boolean;
}) {
	const router = useRouter();
	const toast = useToast();

	const { isOpen, onOpen, onClose } = useDisclosure();
	const [fetching, setFetching] = useState(false);

	const handleReSubmit = () => {
		setFetching(true);
		axios
			.patch(`/api/bots/${bot.id}/resubmit`)
			.then(() => {
				toast({
					title: 'Bot re-enviado',
					description: `El bot ${bot.username} ha sido re-enviado para revisión.`,
					status: 'success',
					duration: 9000,
					isClosable: true
				});
				setBots!(prev => {
					prev = prev.filter(b => b.id !== bot.id);
					prev.push({ ...bot, state: 'pending' });
					return prev;
				});
				setTimeout(() => setFetching(false), 5000);
			})
			.catch(err => {
				toast({
					title: 'Error',
					description:
						err?.response?.error ??
						err?.message ??
						'Ha ocurrido un error al reenviar el bot',
					status: 'error',
					duration: 9000,
					isClosable: true
				});
				setTimeout(() => setFetching(false), 5000);
			});
	};

	const Buttons = admin ? (
		<>
			<Link href={bot.state == 'approved' ? `/bots/${bot.id}` : ''} w={'full'}>
				<Button
					colorScheme={'green'}
					variant={'ghost'}
					w={'full'}
					onClick={() => {
						if (bot.state == 'approved') {
							void router.push(`/bots/${bot.id}`);
						} else {
							setCurrentBot!(bot.id);
							openModal!('approve');
						}
					}}
				>
					{bot.state == 'approved' ? 'Ver' : 'Aprobar'}
				</Button>
			</Link>
			<Button
				onClick={() => {
					setCurrentBot!(bot.id);
					openModal!('deny');
				}}
				disabled={bot.state == 'rejected'}
				w={'full'}
				colorScheme={'red'}
				variant={'ghost'}
			>
				Rechazar
			</Button>
		</>
	) : (
		<>
			{bot.state == 'rejected' ? (
				<Button
					disabled={fetching}
					onClick={handleReSubmit}
					w={'full'}
					colorScheme={'orange'}
					variant={'ghost'}
				>
					Re-subir
				</Button>
			) : (
				<Link href={`/bots/${bot.id}`} w={'full'}>
					<Button colorScheme={'orange'} variant={'ghost'} w={'full'}>
						Ver
					</Button>
				</Link>
			)}
			<Link href={bot.state !== 'approved' ? '' : `/bots/${bot.id}`} w={'full'}>
				<Button
					w={'full'}
					onClick={bot.state !== 'approved' ? onOpen : undefined}
					colorScheme={'purple'}
					variant={'ghost'}
				>
					<Icon
						c="var(--chakra-color-purple-500)"
						pt={bot.state == 'approved' ? '7px' : '5px'}
						m={'Right'}
						id={bot.state == 'approved' ? 'caret-up' : 'pencil'}
					/>
					{bot.state == 'approved' ? bot.votes.length : 'Editar'}
				</Button>
			</Link>
		</>
	);

	return (
		<>
			<Stack
				zIndex={zIndex}
				alignSelf={'center'}
				justifySelf={'center'}
				spacing={5}
				maxW={'290px'}
				minW={'220px'}
				w={'90%'}
				bg={'whiteAlpha.100'}
				p={5}
				m={2}
				rounded={'2xl'}
				backdropFilter={'blur(10px)'}
			>
				<Stack p={0} w={'100%'} justify={'center'} flexDir={'row'}>
					<Avatar
						bg={'gray.700'}
						size={'xl'}
						name={bot.tag}
						src={bot.avatarURL}
					/>
				</Stack>
				<Stack spacing={5}>
					<Stack>
						<Flex
							justify={'space-between'}
							display={dontDisplayBadge ? 'none' : 'flex'}
						>
							<Tag
								fontSize={'xs'}
								fontWeight={'semibold'}
								color={
									bot.state == 'pending'
										? 'yellow.400'
										: bot.state == 'approved'
										? 'green.400'
										: 'red.400'
								}
							>
								{bot.state == 'pending'
									? 'PENDIENTE'
									: bot.state == 'approved'
									? 'APROBADO'
									: 'RECHAZADO'}
							</Tag>
							{itsMyBot && (
								<MyBotMenu setBots={setBots!} bot={bot} fetching={fetching} />
							)}
						</Flex>
						<Link href={`/bots/${bot.id}`}>
							<Heading
								cursor={'pointer'}
								noOfLines={1}
								as={'span'}
								fontSize={'2xl'}
							>
								{bot.username}
							</Heading>
						</Link>
					</Stack>
					<Text minH={'2.5rem'} noOfLines={2} fontSize={'sm'}>
						{bot.shortDescription}
					</Text>
					<HStack overflowX={'auto'} spacing={2}>
						{bot.tags.sort().map((t, i) => (
							<TagLink key={i} tagName={t} h={'auto'} p={2} />
						))}
					</HStack>
				</Stack>
				<Stack w={'full'} direction={'row'} spacing={5}>
					{Buttons}
				</Stack>
			</Stack>
			<EditBot isOpen={isOpen} onClose={onClose} bot={bot} />
		</>
	);
}

export function EditBot({
	isOpen,
	onClose,
	bot
}: {
	isOpen: boolean;
	onClose: () => void;
	bot: BotApplication;
}) {
	const [prefix, setPrefix] = useState(bot.prefix);
	const [web, setWeb] = useState(bot.websiteURL);
	const [github, setGithub] = useState(bot.githubURL);

	return (
		<Drawer isOpen={isOpen} placement="right" onClose={onClose}>
			<DrawerOverlay />
			<DrawerContent
				bg="blackAlpha.600"
				backdropFilter={'blur(10px)'}
				borderWidth="1px"
			>
				<DrawerCloseButton />
				<DrawerHeader borderBottomWidth="1px">Editar {bot.tag}</DrawerHeader>

				<DrawerBody>
					<Text>Característica en desarrollo. No se puede editar el bot.</Text>
				</DrawerBody>

				<DrawerFooter borderTopWidth="1px">
					<Button colorScheme="red" variant="outline" mr={3} onClick={onClose}>
						Salir
					</Button>
				</DrawerFooter>
			</DrawerContent>
		</Drawer>
	);
}

export function MyBotMenu({
	bot,
	fetching,
	setBots
}: {
	bot: BotApplication;
	fetching: boolean;
	setBots: (
		bot: BotApplication[] | ((prev: BotApplication[]) => BotApplication[])
	) => void;
}) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [deleting, setDeleting] = useState(false);
	const toast = useToast();

	const handleDeleteBot = () => {
		setDeleting(true);
		axios
			.delete(`/api/bots/${bot.id}`)
			.then(() => {
				setDeleting(false);
				onClose();
				setBots(prev => prev.filter(b => b.id !== bot.id));
				toast({
					title: 'Bot eliminado',
					description: `Eliminaste a ${bot.username} de la botlist.`,
					status: 'success',
					duration: 5000,
					isClosable: true
				});
			})
			.catch(err => {
				setDeleting(false);
				toast({
					title: 'Ha ocurrido un error',
					description:
						err?.response?.error ??
						err?.message ??
						'No se ha podido eliminar el bot.',
					status: 'error',
					duration: 5000,
					isClosable: true
				});
			});
	};

	return (
		<>
			<Menu>
				<MenuButton
					disabled={fetching}
					p={0}
					minW={6}
					h={'auto'}
					zIndex={99}
					as={IconButton}
				>
					⋮
				</MenuButton>
				<MenuList bg="gray.900" zIndex={99}>
					<MenuItem onClick={onOpen} color="red.400">
						Eliminar bot
					</MenuItem>
				</MenuList>
			</Menu>
			<Modal
				closeOnEsc={!deleting}
				closeOnOverlayClick={!deleting}
				motionPreset="slideInBottom"
				isCentered
				isOpen={isOpen}
				onClose={onClose}
			>
				<ModalOverlay />
				<ModalContent bg="gray.900">
					<ModalHeader title={`¿Deseas eliminar a ${bot.username}?`} />
					<ModalCloseButton disabled={deleting} />
					<ModalBody>
						<UnorderedList fontSize={'sm'}>
							<ListItem>Ningún usuario podrá ver tu bot.</ListItem>
							<ListItem>
								Se eliminarán todas las votaciones y comentarios de este bot.
							</ListItem>
							<ListItem>Se expulsará al bot del servidor.</ListItem>
							<br />
						</UnorderedList>
						Esta acción no se puede deshacer.
					</ModalBody>

					<ModalFooter>
						<Button
							onClick={handleDeleteBot}
							disabled={deleting}
							variant="ghost"
							colorScheme={'red'}
						>
							Eliminar definitivamente
						</Button>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
