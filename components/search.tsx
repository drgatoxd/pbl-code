import {
	Button,
	HStack,
	Kbd,
	Text,
	useDisclosure,
	useEventListener,
	Input,
	Flex,
	Center,
	ModalBody,
	Stack,
	Skeleton,
	Heading,
	ModalFooter,
	Avatar,
	SlideFade,
	ModalOverlay
} from '@chakra-ui/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SearchIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { Icon } from './icon';
import { Link } from './link';
import { UpperCase } from '../lib/functions';
import { Spinner } from './spinner';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Modal, ModalContent } from './Modal';

interface Result {
	name: string;
	type: 'bot' | 'tag' | 'user' | 'cmd';
	href: string;
	avatar?: string;
	votes?: number;
}

export function SearchBar({ tag }: { tag: string }) {
	const { isOpen, onOpen, onClose } = useDisclosure();
	const [query, setQuery] = useState('');
	const [isFetching, setFetching] = useState(false);
	const [ctrlKey, setCtrlKey] = useState('ctrl');
	const [results, setResults] = useState<Result[]>([]);
	const [active, setActive] = useState(0);
	const eventRef = useRef<'mouse' | 'keyboard'>(null);
	const menuRef = useRef<HTMLDivElement>(null);
	const router = useRouter();

	useEffect(() => {
		if (/(Mac|iPhone|iPod|iPad)/i.test(window.navigator?.platform)) {
			setCtrlKey('⌘');
		}
	}, []);

	useEffect(() => {
		setFetching(true);
		setActive(0);
		setResults([]);
		if (!query.length && !isFetching) {
			return setFetching(false);
		}
		const delayDebounceFn = setTimeout(() => {
			if (!query.length) return setFetching(false);
			axios
				.get('/api/search', { params: { q: query } })
				.then(
					({
						data
					}: {
						data: {
							results: {
								bots: Result[];
								tags: Result[];
								users: Result[];
								commands: Result[];
							};
						};
					}) => {
						console.log(data);

						const parsedBots = data.results.bots.map(b => ({
							name: b.name,
							type: 'bot',
							href: b.href,
							avatar: b.avatar,
							votes: b.votes
						}));
						const parsedTags = data.results.tags.map(t => ({
							name: t.name,
							type: 'tag',
							href: t.href,
							avatar: t.avatar
						}));
						const parsedUsers = data.results.users.map(u => ({
							name: u.name,
							type: 'user',
							href: u.href,
							avatar: u.avatar
						}));
						const parsedCommands = data.results.commands.map(c => ({
							name: c.name,
							type: 'cmd',
							href: c.href
						}));

						const order = ['bot', 'user', 'tag', 'cmd'];

						setFetching(false);
						setResults(
							(
								parsedCommands
									.concat(parsedUsers)
									.concat(parsedTags)
									.concat(parsedBots) as Result[]
							).sort((x, y) => order.indexOf(x.type) - order.indexOf(y.type))
						);
					}
				)
				.catch(err => {
					console.log(err);
					setFetching(false);
					setResults([]);
				});
		}, 300);

		return () => {
			clearTimeout(delayDebounceFn);
			setResults([]);
		};
	}, [query]);

	useEventListener('keydown', event => {
		const isMac = /(Mac|iPhone|iPod|iPad)/i.test(window.navigator?.platform);
		const hotkey = isMac ? 'metaKey' : 'ctrlKey';
		if (event?.key?.toLowerCase() === 'k' && event[hotkey]) {
			event.preventDefault();
			isOpen ? onClose() : onOpen();
		}
	});

	const onKeyDown = useCallback(
		// @ts-ignore
		(e: KeyboardEvent<HTMLInputElement>) => {
			// @ts-expect-error
			eventRef.current = 'keyboard';
			switch (e.key) {
				case 'ArrowDown': {
					e.preventDefault();
					const aea = active + 1 < results.length ? active + 1 : 0;
					setActive(aea);
					if (aea > 4) {
						menuRef.current!.scrollTop += 100;
					} else if (aea == 0) {
						menuRef.current!.scrollTop = 0;
					}
					break;
				}
				case 'ArrowUp': {
					e.preventDefault();
					const aea = active - 1 >= 0 ? active - 1 : results.length - 1;
					setActive(aea);
					if (aea < results.length - 4) {
						menuRef.current!.scrollTop -= 100;
					} else if (aea == results.length - 1) {
						menuRef.current!.scrollTop = 10000;
					}
					break;
				}
				case 'Enter': {
					if (results?.length <= 0) {
						break;
					}

					setQuery('');
					onClose();
					void router.push(results[active].href);
					break;
				}
			}
		},
		[active, results, router]
	);

	return (
		<>
			<Button
				onClick={onOpen}
				flex="1"
				type="button"
				lineHeight="1.2"
				whiteSpace="nowrap"
				alignItems="center"
				color="gray.400"
				bg={'whiteAlpha.200'}
				py="3"
				pr={['inherit', '5']}
				outline="0"
				_focus={{ shadow: 'none' }}
				rounded="md"
				maxW={['48px', '80%']}
			>
				<SlideFade in offsetY={-10} style={{ width: '100%' }}>
					<HStack display={['none', 'flex']} w="full" ml="3" spacing="4px">
						<Text noOfLines={1} textAlign="left" flex="1">
							{query ? `Buscar "${query}"` : `Intenta buscar "${tag}"`}
						</Text>
						<HStack display={['none', 'flex']} spacing="4px">
							<Kbd rounded="2px">{ctrlKey}</Kbd>
							<Kbd rounded="2px">K</Kbd>
						</HStack>
					</HStack>
					<Flex display={['flex', 'none']}>
						<Icon v="l" id="search" />
					</Flex>
				</SlideFade>
			</Button>

			<Modal
				scrollBehavior={'inside'}
				onClose={onClose}
				isOpen={isOpen}
				motionPreset="slideInBottom"
				hasOverlay
				isCentered={false}
			>
				<ModalOverlay backdropFilter="blur(10px)" />
				<ModalContent
					role="combobox"
					aria-expanded="true"
					aria-haspopup="listbox"
					rounded="lg"
					overflow="hidden"
					top="4vh"
					shadow="lg"
					maxW="600px"
					border={'2px solid gray.300'}
					bg="gray.800"
					mx={5}
				>
					<Flex w={'100%'} justify={'space-evenly'}>
						<Center display={['none', 'flex']}>
							{isFetching ? <Spinner /> : <SearchIcon />}
						</Center>
						<Input
							onKeyDown={onKeyDown}
							aria-autocomplete="list"
							autoComplete="off"
							autoCorrect="off"
							spellCheck="false"
							maxLength={40}
							border={'none !important'}
							shadow={'none !important'}
							sx={{
								w: '80%',
								h: '60px',
								fontWeight: 'medium'
							}}
							placeholder="Busca entre los mejores bots de Discord"
							value={query}
							onChange={e => {
								setFetching(true);
								setResults([]);
								setQuery(e.target.value);
							}}
						/>
					</Flex>
					<ModalBody
						ref={menuRef}
						// scrollBehavior="smooth"
						as={motion.div}
					>
						<Stack p={2} spacing={3} role={'listbox'} aria-live={'polite'}>
							{query.length ? (
								results.length == 0 ? (
									isFetching ? (
										<>
											<Skeleton height="60px" />
											<Skeleton height="60px" />
											<Skeleton height="60px" />
										</>
									) : (
										<Heading as="h3" size="md">
											No se encontraron resultados
										</Heading>
									)
								) : (
									<>
										{results.map((r, i) => (
											<Link href={r.href} key={r.name}>
												<HStack
													onClick={() => {
														setQuery('');
														onClose();
													}}
													cursor={'pointer'}
													transition={'.2s ease'}
													_hover={{
														bg: 'gray.600'
													}}
													p={5}
													rounded={'md'}
													borderWidth="1px"
													minH={'60px'}
													onMouseEnter={() => setActive(i)}
													role={'option'}
													_selected={{
														bg: 'gray.600'
													}}
													aria-selected={active == i ? true : undefined}
												>
													{['tag', 'cmd'].includes(r.type) ? (
														<Icon
															c={'salmon'}
															v={'l'}
															id={
																r.type == 'bot'
																	? 'robot'
																	: r.type == 'tag'
																	? 'hashtag'
																	: r.type == 'cmd'
																	? 'command'
																	: 'user'
															}
															s={'1.25rem'}
														/>
													) : (
														<Avatar
															mr={1}
															name={r.name}
															src={r.avatar}
															size="sm"
														/>
													)}

													<Heading noOfLines={2} as={'span'} fontSize={'lg'}>
														{UpperCase(r.name)}
														<br />
														<Text as="span" fontSize="sm" color="gray.400">
															{!isNaN(r.votes as number)
																? `${r.votes} votos`
																: r.type == 'cmd'
																? 'Comando'
																: r.type == 'user'
																? 'Usuario'
																: 'Etiqueta'}
														</Text>
													</Heading>
												</HStack>
											</Link>
										))}
									</>
								)
							) : (
								<div>Buscar</div>
							)}
						</Stack>
					</ModalBody>

					<ModalFooter
						display={['none', 'flex']}
						justifyContent={'space-around'}
						fontSize={'sm'}
						color={'gray.400'}
					>
						<Text>
							Navegar con <Kbd mx={1}>↑</Kbd>
							<Kbd>↓</Kbd>
						</Text>
						<Text>
							Acceder con <Kbd mx={1}>Enter</Kbd>
						</Text>
					</ModalFooter>
				</ModalContent>
			</Modal>
		</>
	);
}
