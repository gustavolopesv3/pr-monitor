import styled from "styled-components";

interface BadgeProps {
    hexadecimal: string;
    name: string
}

interface BadgeStyledProps {
    hexadecimal: string;
}

export const BadgeStyle = styled.div<BadgeStyledProps>`
    border-radius: 5px;
    border: 1px solid ${props => `#${props.hexadecimal}`};
    color: ${props => `#${props.hexadecimal}`};
    max-width: max-content;
    padding: 1px;
`

export function Badge({hexadecimal, name}:BadgeProps){
    return (
        <BadgeStyle hexadecimal={hexadecimal}>
            <span>{name}</span>
        </BadgeStyle>
    )
}