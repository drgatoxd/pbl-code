import React from 'react';
import PropTypes from 'prop-types';

import {
	useSpring,
	useTransition,
	animated,
	config,
	SpringConfig
} from 'react-spring';

const TextTransition: React.FC<TextTransitionProps> = props => {
	const {
		direction = 'up',
		inline = false,
		springConfig = config.default,
		delay = 0,
		className,
		style,
		children
	} = props;
	const [started, setStarted] = React.useState(false);

	const initialRun = React.useRef(false);

	const transitions = useTransition([children], {
		from: {
			opacity: 0,
			transform: `translateX(${direction === 'down' ? '-15%' : '15%'})`
		},
		enter: { opacity: 1, transform: 'translateX(0%)' },
		leave: {
			opacity: 0,
			transform: `translateX(${direction === 'down' ? '15%' : '-15%'})`,
			position: 'absolute'
		},
		config: springConfig,
		immediate: !started,
		delay: started ? delay : undefined
	});

	const currentRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		return setStarted(true);
	}, []);

	const widthTransition = useSpring({
		config: springConfig,
		immediate: !started,
		delay: started ? delay : undefined
	});

	return (
		<animated.div
			className={`text-transition ${className}`}
			style={{
				...(inline && started ? widthTransition : undefined),
				...style,
				whiteSpace: inline ? 'nowrap' : 'normal',
				display: inline ? 'inline-flex' : 'flex',
				height: 'max-content'
			}}
		>
			{transitions((styles, item) => {
				// console.log(item);
				return (
					<animated.div
						style={{ ...styles }}
						ref={item === children ? currentRef : undefined}
					>
						{item}
					</animated.div>
				);
			})}
		</animated.div>
	);
};

interface TextTransitionProps {
	readonly direction?: 'up' | 'down';
	readonly inline?: boolean;
	readonly delay?: number;
	readonly springConfig?: SpringConfig;
	readonly className?: string;
	readonly style?: React.CSSProperties;
	readonly children: React.ReactNode;
}

TextTransition.propTypes = {
	direction: PropTypes.oneOf(['up', 'down']),
	inline: PropTypes.bool,
	delay: PropTypes.number,
	className: PropTypes.string,
	style: PropTypes.object,
	springConfig: PropTypes.any
};

export default TextTransition;
