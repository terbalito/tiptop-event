import { v4 as uuidv4 } from "uuid";

let controllers = []; // tu peux stocker en mémoire pour l’instant (après → Firebase)

export const getControllers = (req, res) => {
  res.json(controllers);
};

export const createController = (req, res) => {
  const newCtrl = {
    id: uuidv4(),
    username: "ctrl_" + Math.floor(Math.random() * 10000),
    password: Math.random().toString(36).slice(-8),
    createdAt: new Date()
  };
  controllers.push(newCtrl);
  res.json(newCtrl);
};
