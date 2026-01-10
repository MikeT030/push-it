// Import all avatar images
import beaver from "@/assets/avatars/beaver.png";
import bull from "@/assets/avatars/bull.png";
import cat from "@/assets/avatars/cat.png";
import cow from "@/assets/avatars/cow.png";
import crocodile from "@/assets/avatars/crocodile.png";
import deer from "@/assets/avatars/deer.png";
import dog from "@/assets/avatars/dog.png";
import duck from "@/assets/avatars/duck.png";
import elephant from "@/assets/avatars/elephant.png";
import fox from "@/assets/avatars/fox.png";
import frog from "@/assets/avatars/frog.png";
import gecko from "@/assets/avatars/gecko.png";
import gorilla from "@/assets/avatars/gorilla.png";
import hamster from "@/assets/avatars/hamster.png";
import kangaroo from "@/assets/avatars/kangaroo.png";
import lion from "@/assets/avatars/lion.png";
import meerkat from "@/assets/avatars/meerkat.png";
import monkey from "@/assets/avatars/monkey.png";
import orangutan from "@/assets/avatars/orangutan.png";
import panda from "@/assets/avatars/panda.png";
import ram from "@/assets/avatars/ram.png";
import rooster from "@/assets/avatars/rooster.png";
import tiger from "@/assets/avatars/tiger.png";

export interface AvatarOption {
  id: string;
  name: string;
  src: string;
}

export const avatarOptions: AvatarOption[] = [
  { id: "beaver", name: "Beaver", src: beaver },
  { id: "bull", name: "Bull", src: bull },
  { id: "cat", name: "Cat", src: cat },
  { id: "cow", name: "Cow", src: cow },
  { id: "crocodile", name: "Crocodile", src: crocodile },
  { id: "deer", name: "Deer", src: deer },
  { id: "dog", name: "Dog", src: dog },
  { id: "duck", name: "Duck", src: duck },
  { id: "elephant", name: "Elephant", src: elephant },
  { id: "fox", name: "Fox", src: fox },
  { id: "frog", name: "Frog", src: frog },
  { id: "gecko", name: "Gecko", src: gecko },
  { id: "gorilla", name: "Gorilla", src: gorilla },
  { id: "hamster", name: "Hamster", src: hamster },
  { id: "kangaroo", name: "Kangaroo", src: kangaroo },
  { id: "lion", name: "Lion", src: lion },
  { id: "meerkat", name: "Meerkat", src: meerkat },
  { id: "monkey", name: "Monkey", src: monkey },
  { id: "orangutan", name: "Orangutan", src: orangutan },
  { id: "panda", name: "Panda", src: panda },
  { id: "ram", name: "Ram", src: ram },
  { id: "rooster", name: "Rooster", src: rooster },
  { id: "tiger", name: "Tiger", src: tiger },
];

export const getAvatarById = (id: string | null): AvatarOption | undefined => {
  if (!id) return undefined;
  return avatarOptions.find((avatar) => avatar.id === id);
};
