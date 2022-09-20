import { useSession, signIn, signOut } from 'next-auth/react';
import {
	Avatar,
	Box,
	Button,
	Container,
	HStack,
	Menu,
	MenuButton,
	MenuDivider,
	MenuItem,
	MenuList
} from '@chakra-ui/react';
import Image from 'next/image';
import meongCool from '../assets/meong-cool.gif';
import { DiscordUser } from '../pages/api/auth/[...nextauth]';
import { Link } from './link';
import { SearchBar } from './search';
import { useEffect, useState } from 'react';
import axios from 'axios';

export function Navbar() {
	const { data: session } = useSession();
	const user = session?.profile as DiscordUser | undefined;
	const [tag, setTag] = useState('');

	useEffect(() => {
		axios.get('/api/random/tag').then(({ data }) => {
			setTag(data.data);
		});
	}, []);

	return (
		<Box
			w={'100%'}
			top={0}
			position={'sticky'}
			py={3}
			zIndex={'999'}
			h={'70px'}
			backdropFilter={'blur(10px)'}
		>
			<Container
				maxW={'container.xl'}
				justifyContent={'space-between'}
				flexDir={'row'}
				display={'flex'}
				alignItems={'center'}
				gap={5}
			>
				<Box h={'48px'} w={'48px'}>
					<Link href={'/'}>
						<Box position={'relative'}>
							<Image
								src={meongCool}
								layout={'fill'}
								objectFit={'contain'}
								className={'aña'}
								alt="PubertLand Logo"
							/>
						</Box>
					</Link>
				</Box>
				<SearchBar tag={tag} />
				{user ? (
					<Menu>
						<MenuButton>
							<Box>
								<Avatar size={'sm'} src={user.avatar} name={user.username} />
							</Box>
						</MenuButton>
						<MenuList bg="gray.900">
							<Link href={'/u/@me'}>
								<MenuItem>Perfil</MenuItem>
							</Link>
							<Link href={'/new'}>
								<MenuItem>Agregar bot</MenuItem>
							</Link>
							{user.verified && (
								<Link href={'/admin'}>
									<MenuItem>Panel de admin</MenuItem>
								</Link>
							)}
							<MenuDivider />
							<Link href={'https://discord.gg/Z4wj6gYyvE'}>
								<MenuItem>Discord</MenuItem>
							</Link>
							<MenuItem
								onClick={() =>
									signOut({
										callbackUrl: '/'
									})
								}
								color={'red.400'}
							>
								Cerrar Sesión
							</MenuItem>
						</MenuList>
					</Menu>
				) : (
					<Button onClick={() => void signIn('discord')}>Acceder</Button>
				)}
			</Container>
		</Box>
	);
}
