/*
 * Written by Quoc
 * Back-end for the server 
 * As of May 31, 2024
 */
/*---------------------------------------------------------------------*/
import express from "express"; // app.get method,...
import {
	RegExpMatcher,
	TextCensor,
	englishDataset,
	englishRecommendedTransformers,
} from 'obscenity';
import bodyParser from "body-parser"; // process data sent in an http body
import _ from "lodash"; // change casing and stuff, use later
import mongoose from "mongoose"; // database
/*---------------------------------------------------------------------*/
/* connect to mongoDB database */
mongoose.connect("mongodb+srv://"+process.env.MONGO_URI, {
  useNewUrlParser: true,
});

/* struct ideasSchema */
const ideasSchema = {
  name: String,
};

/* wrap the struct, while at the same time connecting to mongoose  */
const Idea = mongoose.model("Ideas", ideasSchema);

// these are just new objects being created
const idea1 = new Idea({
  name: "Welcome to Columbiyum!",
});

const idea2 = new Idea({
  name: "Where should we visit next?",
});

const idea3 = new Idea({
  name: "Send us some ideas!",
});

// array or list of objects
const defaultItems = [idea1, idea2, idea3];

// basic constant for starting server
const app = express();
// basic constant of Obscenity()
const matcher = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

/*---------------------------------------------------------------------*/
/* housekeeping for code */ 
// used when setting up middleware for handling incoming HTTP requests
app.use(bodyParser.urlencoded({ extended: true })); 

// serve static files from the specified directory.
app.use(express.static("public"));

// tells Express to use EJS as the template engine for rendering views
app.set("view engine", "ejs");
/*---------------------------------------------------------------------*/
/* main|index.ejs */
app.get("/", (req, res) => {
  res.render("index.ejs", {});
});
/* END of main|index.ejs */

/* about.ejs */
app.get("/about", (req, res) => {
  res.render("about.ejs", {});
});
/* END of about.ejs */

/* GET route to display recommendations */ 
app.get("/recommendations", (req, res) => {
  Idea.find().then((foundIdea) => {
    if (foundIdea.length === 0) {
      if (defaultItems.length > 0) {
        // Insert and check if the objects are saved
        Idea.insertMany(defaultItems)
          .then(function () {
            console.log("Successfully saved default items to DB");
          })
          .catch(function (err) {
            console.log(err);
          });
      } else {
        console.log("No valid items to save to DB");
      }

      res.redirect("/recommendations");
    } else {
      res.render("recommendations.ejs", {
        ideas: foundIdea,
      });
    }
  });
});
/* END OF - GET route to display recommendations */ 

/* POST route to add a new recommendation */ 
app.post("/recommendations", function (req, res) {
  const ideaName = req.body.userText;

  // Check if ideaName is non-empty and not just whitespace
  if (ideaName && ideaName.trim() !== "" && !matcher.hasMatch(ideaName)) {
    const idea = new Idea({
      name: ideaName.trim(), // Trim the input to remove leading/trailing whitespace
    });
    idea.save()
      .then(() => {
        res.redirect("/recommendations");
      })
      .catch((err) => {
        console.log(err);
        res.redirect("/recommendations");
      });
  } else {
    console.log("Empty input received, not adding to the database");
    res.redirect("/recommendations");
  }
});
/* END - POST route to add a new recommendation */ 

// click to delete
app.post("/delete", async (req, res) => {
  const checkedItemID = req.body.checkbox;
  await Idea.findByIdAndRemove(checkedItemID);
  res.redirect("/recommendations");
});
/* END of recommendation.ejs */

/* where to find the local website on computer */
app.listen(process.env.PORT || 3030, () => {
  console.log(`Server is running on http://localhost:3030`);
});
