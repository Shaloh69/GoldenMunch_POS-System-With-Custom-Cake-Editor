// HeroUI Component Exports
// This file re-exports all HeroUI components for easier imports
export { Button } from "@heroui/button";
export { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
export { Input, Textarea } from "@heroui/input";
export { Select, SelectItem, SelectSection } from "@heroui/select";
export { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
export { Chip } from "@heroui/chip";
export { Avatar } from "@heroui/avatar";
export { Spinner } from "@heroui/spinner";
export { Progress } from "@heroui/progress";
export { Switch } from "@heroui/switch";
export { Divider } from "@heroui/divider";
export { Link } from "@heroui/link";
export { Image } from "@heroui/image";
export { Tooltip } from "@heroui/tooltip";
export { Badge } from "@heroui/badge";
export { Skeleton } from "@heroui/skeleton";
export { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table";
export { Tabs, Tab } from "@heroui/tabs";
export { Navbar, NavbarBrand, NavbarContent, NavbarItem, NavbarMenu, NavbarMenuItem, NavbarMenuToggle } from "@heroui/navbar";
export { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, DropdownSection } from "@heroui/dropdown";
export { Popover, PopoverTrigger, PopoverContent } from "@heroui/popover";
export { Pagination } from "@heroui/pagination";
export { Accordion, AccordionItem } from "@heroui/accordion";
export { Code } from "@heroui/code";
export { Snippet } from "@heroui/snippet";
export { Kbd } from "@heroui/kbd";
export { Spacer } from "@heroui/spacer";
export { ScrollShadow } from "@heroui/scroll-shadow";
export { User } from "@heroui/user";
export { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerFooter } from "@heroui/drawer";
export { RadioGroup, Radio } from "@heroui/radio";
export { Listbox, ListboxItem, ListboxSection } from "@heroui/listbox";
export { Autocomplete, AutocompleteItem, AutocompleteSection } from "@heroui/autocomplete";

// Tailwind Variants for custom styling
import { tv } from "tailwind-variants";

export const title = tv({
  base: "tracking-tight inline font-semibold",
  variants: {
    color: {
      primary: "from-sunny-yellow to-deep-orange-yellow",
      violet: "from-[#FF1CF7] to-[#b249f8]",
      yellow: "from-[#FF705B] to-[#FFB457]",
      blue: "from-[#5EA2EF] to-[#0072F5]",
      cyan: "from-[#00b7fa] to-[#01cfea]",
      green: "from-[#6FEE8D] to-[#17c964]",
      pink: "from-[#FF72E1] to-[#F54C7A]",
      foreground: "dark:from-[#FFFFFF] dark:to-[#4B4B4B]",
    },
    size: {
      sm: "text-3xl lg:text-4xl",
      md: "text-[2.3rem] lg:text-5xl",
      lg: "text-4xl lg:text-6xl",
    },
    fullWidth: {
      true: "w-full block",
    },
  },
  defaultVariants: {
    size: "md",
  },
  compoundVariants: [
    {
      color: [
        "primary",
        "violet",
        "yellow",
        "blue",
        "cyan",
        "green",
        "pink",
        "foreground",
      ],
      class: "bg-clip-text text-transparent bg-gradient-to-b",
    },
  ],
});

export const subtitle = tv({
  base: "w-full md:w-1/2 my-2 text-lg lg:text-xl text-default-600 block max-w-full",
  variants: {
    fullWidth: {
      true: "!w-full",
    },
  },
  defaultVariants: {
    fullWidth: true,
  },
});
