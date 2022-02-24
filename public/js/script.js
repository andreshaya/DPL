"use strict";

contact = document.getElementById("contactInfo");

contact.onclick = function scroll{
    footer = document.getElementById("footer")
    footer.scrollIntoView({ behavior: 'smooth'})
}
