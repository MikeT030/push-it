// Import all avatar images
import bear from "@/assets/avatars/bear.png";
import beaver from "@/assets/avatars/beaver.png";
import boar from "@/assets/avatars/boar.png";
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
import grizzly from "@/assets/avatars/grizzly.png";
import hamster from "@/assets/avatars/hamster.png";
import horse from "@/assets/avatars/horse.png";
import kangaroo from "@/assets/avatars/kangaroo.png";
import lion from "@/assets/avatars/lion.png";
import lizard from "@/assets/avatars/lizard.png";
import meerkat from "@/assets/avatars/meerkat.png";
import monkey from "@/assets/avatars/monkey.png";
import orangutan from "@/assets/avatars/orangutan.png";
import otter from "@/assets/avatars/otter.png";
import panda from "@/assets/avatars/panda.png";
import pig from "@/assets/avatars/pig.png";
import puma from "@/assets/avatars/puma.png";
import rabbit from "@/assets/avatars/rabbit.png";
import raccoon from "@/assets/avatars/raccoon.png";
import ram from "@/assets/avatars/ram.png";
import rooster from "@/assets/avatars/rooster.png";
import tiger from "@/assets/avatars/tiger.png";

export interface AvatarOption {
  id: string;
  name: string;
  src: string;
}

export const avatarOptions: AvatarOption[] = [
  { id: "bear", name: "Bear", src: bear },
  { id: "beaver", name: "Beaver", src: beaver },
  { id: "boar", name: "Boar", src: boar },
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
  { id: "grizzly", name: "Grizzly", src: grizzly },
  { id: "hamster", name: "Hamster", src: hamster },
  { id: "horse", name: "Horse", src: horse },
  { id: "kangaroo", name: "Kangaroo", src: kangaroo },
  { id: "lion", name: "Lion", src: lion },
  { id: "lizard", name: "Lizard", src: lizard },
  { id: "meerkat", name: "Meerkat", src: meerkat },
  { id: "monkey", name: "Monkey", src: monkey },
  { id: "orangutan", name: "Orangutan", src: orangutan },
  { id: "otter", name: "Otter", src: otter },
  { id: "panda", name: "Panda", src: panda },
  { id: "pig", name: "Pig", src: pig },
  { id: "puma", name: "Puma", src: puma },
  { id: "rabbit", name: "Rabbit", src: rabbit },
  { id: "raccoon", name: "Raccoon", src: raccoon },
  { id: "ram", name: "Ram", src: ram },
  { id: "rooster", name: "Rooster", src: rooster },
  { id: "tiger", name: "Tiger", src: tiger },
];

export const getAvatarById = (id: string | null): AvatarOption | undefined => {
  if (!id) return undefined;
  return avatarOptions.find((avatar) => avatar.id === id);
};
