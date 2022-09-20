import NextLink from 'next/link';
import { Link as ChakraLink, LinkProps } from '@chakra-ui/react';

export function Link({
	children,
	href,
	...props
}: {
	children: React.ReactNode;
	href: string;
} & LinkProps) {
	return (
		<NextLink href={href} passHref>
			<ChakraLink
				textDecoration={'none !important'}
				rel="noopener noreferrer"
				{...props}
			>
				{children}
			</ChakraLink>
		</NextLink>
	);
}
