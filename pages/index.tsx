import type { NextPage } from 'next';
import Head from 'next/head';
import {
	Avatar,
	Button,
	Container,
	Divider,
	Flex,
	Heading,
	HStack,
	Stack,
	Text
} from '@chakra-ui/react';
import { tags } from '../config';
import { TagButton } from '../components/tag';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../components/icon';
import { BotApplication } from '../schemas/Bot';
import axios from 'axios';
import { Spinner } from '../components/spinner';
import { ChevronUpIcon, StarIcon } from '@chakra-ui/icons';
import { Link } from '../components/link';

const Home: NextPage<{ color: string }> = ({ color }) => {
	const ref = useRef<HTMLDivElement>(null);
	const [bots, setBots] = useState<BotApplication[]>([]);
	const [sort, setSort] = useState<'votes' | 'created'>('votes');
	const [fetchingBots, setFetchingBots] = useState(true);

	useEffect(() => {
		axios.get('/api/bots').then(({ data }) => {
			setBots(
				(data.data as BotApplication[]).filter(b => b.state == 'approved')
			);
			setFetchingBots(false);
		});
	}, []);

	return (
		<Container mt={10} maxW={'container.xl'}>
			<Head>
				<title>Pubertland BotList</title>
				<meta
					property="og:title"
					content={`¡Bienvenido a Pubertland BotList!`}
				/>
				<meta property="og:site_name" content="Pubertland BotList" />
				<meta property="og:type" content="website" />
				<meta
					property="og:description"
					content="¡Comparte tus bots con otros usuarios!"
				/>
				<meta property="theme-color" content="#ff6640" />
				<meta
					property="og:image"
					content="https://i.pinimg.com/originals/c6/7a/05/c67a059acd80df0b54ef075b50d2d69a.gif"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Flex gap={5} py={5} px={[2, 10]} flexDir="column">
				<Heading>Imagina una web con los mejores bots de Discord</Heading>
				<HStack>
					<Button
						display={['none', 'block']}
						rounded={'full'}
						onClick={() =>
							ref.current!.scrollTo({
								left: ref.current!.scrollLeft - 100,
								behavior: 'smooth'
							})
						}
					>
						<Icon id={'arrow-left'} />
					</Button>
					<HStack ref={ref} overflowX={'auto'} overflowY={'hidden'} spacing={5}>
						{tags.map((t, i) => (
							<TagButton tagName={t} key={i} />
						))}
					</HStack>
					<Button
						rounded={'full'}
						display={['none', 'block']}
						onClick={() =>
							ref.current!.scroll({
								left: ref.current!.scrollLeft + 100,
								behavior: 'smooth'
							})
						}
					>
						<Icon id={'arrow-right'} />
					</Button>
				</HStack>
			</Flex>
			<Flex gap={0} py={5} px={[2, 10]} flexDir="column">
				<Stack direction={'row'}>
					<Stack w="full">
						<Flex
							justify={'space-between'}
							align="center"
							flexDir={['column', 'row']}
							gap={3}
							mb={5}
						>
							{bots.length ? (
								<>
									<Heading as="h3" fontSize="2xl">
										Bots {sort == 'votes' ? 'populares' : 'recientes'}
									</Heading>
									<Button
										onClick={() =>
											setSort(sort == 'created' ? 'votes' : 'created')
										}
									>
										{sort == 'votes' ? (
											<>
												<Icon id="sparkles" m="Right" pt={'5px'} /> Ver Nuevos
											</>
										) : (
											<>
												<Icon id="fire" m="Right" pt={'5px'} /> Ver Populares
											</>
										)}
									</Button>
								</>
							) : fetchingBots ? (
								<>
									<Spinner /> Cargando...
								</>
							) : (
								<>No hay bots para mostrar :c</>
							)}
						</Flex>
						<Stack w="full">
							{bots
								.sort((x, y) =>
									sort == 'votes'
										? y.votes.length - x.votes.length
										: y.createdAt - x.createdAt
								)
								.slice(0, 50)
								.map((b, i) => (
									<Stack
										rounded={'xl'}
										p={3}
										direction={['column', 'column', 'row']}
										align="center"
										key={i}
										gap={3}
										bg="blackAlpha.400"
									>
										<Stack direction={'row'} w="full" gap={3} align="center">
											<Avatar
												size="lg"
												bg="gray.900"
												src={b.avatarURL}
												name={b.username}
											/>
											<Stack w="full">
												<Stack
													direction="row"
													w="100%"
													justify={'space-between'}
												>
													<Stack spacing={1}>
														<Stack
															w="full"
															direction="row"
															justify={'space-between'}
														>
															<Link href={`/bots/${b.id}`}>
																<Heading
																	cursor="pointer"
																	noOfLines={1}
																	as="h4"
																	fontSize="xl"
																>
																	{b.username}
																</Heading>
															</Link>
														</Stack>
														<Stack direction={'row'} gap={3}>
															<Stack direction={'row'} gap={2}>
																<Text
																	fontSize="xs"
																	display={'flex'}
																	alignItems="center"
																	gap={1}
																>
																	<StarIcon
																		fontSize={'sm'}
																		color="red.900"
																		strokeWidth={'2px'}
																		stroke="red.400"
																	/>
																	{Math.round(
																		(b.comments.reduce(
																			(a, c) => a + c.stars,
																			0
																		) / b.comments.length || 0) * 100
																	) / 100}
																</Text>
																<Text
																	fontSize="xs"
																	display={'flex'}
																	alignItems="center"
																	gap={1}
																>
																	<ChevronUpIcon
																		fontSize={'sm'}
																		color="red.900"
																		strokeWidth={'2px'}
																		stroke="red.400"
																	/>
																	{
																		b.votes.filter(v => v.expires > Date.now())
																			.length
																	}
																</Text>
															</Stack>
															<Divider
																orientation="vertical"
																borderWidth={'1px'}
																h="initial"
																borderColor="#fff3"
															/>
															<Stack
																direction="row"
																display={['none', 'none', 'flex']}
															>
																{b.tags.slice(0, 2).map((t, i) => (
																	<TagButton
																		ht
																		tagName={t}
																		key={i}
																		h="auto"
																		p={1}
																		fontSize="sm"
																	/>
																))}
																{b.tags.length - 2 > 0 && (
																	<TagButton
																		disabled
																		ht
																		tagName={`+${b.tags.length - 2}`}
																		key={i}
																		h="auto"
																		p={1}
																		fontSize="sm"
																	/>
																)}
															</Stack>
														</Stack>
													</Stack>
												</Stack>
												<Text
													noOfLines={[2, 2, 1]}
													color="gray.400"
													fontSize="sm"
													overflowWrap="break-word"
													wordBreak={'break-word'}
												>
													{b.shortDescription}
												</Text>
											</Stack>
										</Stack>
										<Stack
											w={['full', 'full', 'auto']}
											direction={['row', 'row', 'column']}
											h={'auto'}
										>
											<Link href={b.inviteURL} w="full">
												<Button w="full" rounded="xl">
													Invitar
												</Button>
											</Link>
											<Link href={`/bots/${b.id}?vote=true`} w="full">
												<Button w="full" rounded="xl" cursor={'pointer'}>
													Votar (
													{b.votes.filter(v => v.expires > Date.now()).length})
												</Button>
											</Link>
										</Stack>
									</Stack>
								))}
						</Stack>
					</Stack>
					<Stack
						px={5}
						spacing={2}
						display={['none', 'none', 'none', 'flex']}
						minW="25%"
					>
						<Heading as="p" fontSize="xl" mb={5}>
							Enlaces
						</Heading>
						<Button
							textAlign={'left'}
							as="a"
							href="https://discord.gg/Z4wj6gYyvE"
							colorScheme={'purple'}
							variant="ghost"
							justifyContent={'flex-start'}
						>
							<Icon id="discord" v="b" pt={'.25rem'} m="Right" /> Únete al
							Discord
						</Button>
						<Button
							textAlign={'left'}
							as="a"
							href="https://github.com/drgatoxd"
							colorScheme={'purple'}
							variant="ghost"
							justifyContent={'flex-start'}
						>
							<Icon id="github" v="b" pt={'.25rem'} m="Right" /> Visita mi
							GitHub
						</Button>
						<Button
							textAlign={'left'}
							as="a"
							href="https://www.youtube.com/channel/UCHY3_scfbXSPc5B9SLgqPKQ"
							colorScheme={'purple'}
							variant="ghost"
							justifyContent={'flex-start'}
						>
							<Icon id="youtube" v="b" pt={'.25rem'} m="Right" /> Mira mis
							videos
						</Button>
					</Stack>
				</Stack>
			</Flex>
		</Container>
	);
};

export default Home;
