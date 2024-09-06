import { Select } from "@chakra-ui/react";
import { ChangeEventHandler } from "react";

export type SelectTestKindProps = {
    onChange: ChangeEventHandler<HTMLSelectElement>
}

export default function SelectTestKind({ onChange }: SelectTestKindProps) {
    return (
        <Select placeholder="Select Test Kind" onChange={onChange}>
            <option value='general'>general</option>
            <option value='adhoc'>adhoc</option>
            <option value='triage'>triage</option>
            <option value='integration'>integration</option>
            <option value='user_acceptance'>user_acceptance</option>
            <option value='regression'>regression</option>
            <option value='security'>security</option>
            <option value='user_interface'>user_interface</option>
            <option value='scenario'>scenario</option>
        </Select>
    )
}