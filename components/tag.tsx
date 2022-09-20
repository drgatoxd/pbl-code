import { Button, Text } from '@chakra-ui/react';
import { Link } from './link';

export function TagButton({
	tagName,
	focus,
	h,
	p,
	fontSize,
	ht,
	disabled
}: {
	tagName: string;
	focus?: boolean;
	h?: number | 'auto';
	p?: number | 'auto';
	ht?: boolean;
	disabled?: boolean;
	fontSize?:
		| 'xs'
		| 'sm'
		| 'md'
		| 'lg'
		| 'xl'
		| '2xl'
		| '3xl'
		| '4xl'
		| '5xl'
		| '6xl'
		| '7xl'
		| '8xl';
}) {
	return (
		<Link href={`/tag/${tagName.toLowerCase()}`}>
			<Button
				disabled={focus || disabled}
				colorScheme={focus ? 'orange' : 'gray'}
				minW={'auto'}
				h={h}
				p={p}
				fontSize={fontSize}
			>
				<Text
					display={!ht ? 'inline-block' : 'none'}
					color={'orange.400'}
					as={'span'}
					mr={1}
				>
					#
				</Text>
				{tagName}
			</Button>
		</Link>
	);
}
