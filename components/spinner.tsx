import { Spinner as ChakraSpinner } from '@chakra-ui/react';

export function Spinner({
	size,
	...props
}: {
	size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
	return <ChakraSpinner size={size || 'sm'} {...props} label={''} />;
}
