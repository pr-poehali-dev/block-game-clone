import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}"
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				// FNAF-style colors
				fnaf: {
					dark: '#0a0a0a',
					office: '#1a1a1a', 
					camera: '#2a2a2a',
					danger: '#ff0000',
					warning: '#ffaa00',
					safe: '#00ff00',
					light: '#ffff88',
					static: '#555555',
					purple: '#663399'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			perspective: {
				'500': '500px',
				'1000': '1000px',
				'1500': '1500px',
				'2000': '2000px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				rotate3d: {
					'0%': { transform: 'rotateY(0deg) rotateX(0deg)' },
					'50%': { transform: 'rotateY(180deg) rotateX(10deg)' },
					'100%': { transform: 'rotateY(360deg) rotateX(0deg)' }
				},
				float3d: {
					'0%, 100%': { transform: 'translateY(0px) rotateX(0deg)' },
					'50%': { transform: 'translateY(-10px) rotateX(5deg)' }
				},
				zoom3d: {
					'0%': { transform: 'scale3d(0.8, 0.8, 1) rotateY(-10deg)' },
					'100%': { transform: 'scale3d(1, 1, 1) rotateY(0deg)' }
				},
				slide3d: {
					'0%': { transform: 'translateX(-100%) rotateY(-30deg)' },
					'100%': { transform: 'translateX(0%) rotateY(0deg)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fadeIn 0.3s ease-out',
				'pulse-glow': 'pulseGlow 2s infinite',
				'block-place': 'blockPlace 0.2s ease-out',
				'rotate-3d': 'rotate3d 2s ease-in-out infinite',
				'float-3d': 'float3d 3s ease-in-out infinite',
				'zoom-3d': 'zoom3d 0.3s ease-out',
				'slide-3d': 'slide3d 0.5s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;