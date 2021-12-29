const dotenv = require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  process.env.MONGO_URL,
  { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }
);
var fulldate = new Date();
var month = fulldate.getMonth();
var date = fulldate.getDate();
var months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "Juy",
  "August",
  "September",
  "October",
  "November",
  "December"
];
const today = date + " " + months[month];

const itemsSchema = new mongoose.Schema({
  // _id: {type: Number},
  name: String
});
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  // _id: 4,
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  // _id: 5,
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  // _id:6,
  name: "<-- Hit this to delete an item."
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) =>{
  Item.find({}, (err, foundItems)=> {
    if (foundItems.length === 0) {
      Item.insertMany(
        defaultItems,
        { ordered: true, unique: true },
        (err)=> {
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully saved default items to database");
          }
        }
      );
      res.redirect("/");
    } else {
      res.render("list", { listTitle: today, newListItems: foundItems });
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList)=> {
    if (!err) {
      if (!foundList) {
        // Create a new list

        const list = new List({
          name: customListName,
          items: defaultItems
        });

        list.save(() => res.redirect("/" + customListName));
      } else {
        // Show an existing list

        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === today) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) =>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === today) {
    Item.deleteOne({ _id: checkedItemId }, (err) => {
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      (err, foundList)=> {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/about", (req, res) => {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, ()=> {
  console.log(`Server is running at port ${port}`);
});
