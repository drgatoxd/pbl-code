import {
	Heading,
	Modal as ChakraModal,
	ModalHeader as ChakraModalHeader,
	ModalContent as ChakraModalContent,
	ModalHeaderProps,
	ModalOverlay,
	ModalProps,
	ModalContentProps
} from '@chakra-ui/react';
import { LayoutGroup, motion } from 'framer-motion';
import TextTransition from '../textTransition';

export function Modal({
	children,
	hasOverlay,
	...props
}: ModalProps & { hasOverlay?: boolean }) {
	return (
		<ChakraModal isCentered motionPreset="slideInBottom" size="xl" {...props}>
			{!(hasOverlay || false) && <ModalOverlay />}
			{children}
		</ChakraModal>
	);
}

export function ModalContent({ children, ...props }: ModalContentProps) {
	return (
		<ChakraModalContent
			p={[1]}
			bg="gray.900"
			as={motion.div}
			layoutScroll
			// @ts-ignore
			transition={{
				layout: { duration: 0.05 },
				scale: { ease: 'cubic-bezier(0, 0, 0.2, 1)' }
			}}
			{...props}
		>
			{children}
		</ChakraModalContent>
	);
}

export function ModalHeader({
	children,
	title,
	subtitle,
	withAnimation,
	transitionDir,
	...props
}: ModalHeaderProps & {
	title: string;
	subtitle?: string;
	transitionDir?: 'up' | 'down';
	withAnimation?: boolean;
}) {
	return (
		<ChakraModalHeader h={'max-content'} {...props}>
			{withAnimation ? (
				<TextTransition
					springConfig={{
						easing: x => 1 - Math.pow(1 - x, 3),
						duration: 250
					}}
					delay={50}
					direction={transitionDir || 'down'}
				>
					<Heading fontSize={['xl', '3xl']} h={'auto'}>
						{title}
					</Heading>
				</TextTransition>
			) : (
				<Heading fontSize={['xl', '3xl']} h={'auto'}>
					{title}
				</Heading>
			)}

			{!!subtitle && (
				<Heading fontSize="md" fontWeight={'light'} color="gray.400">
					{subtitle}
				</Heading>
			)}
		</ChakraModalHeader>
	);
}
