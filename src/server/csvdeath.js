'use strict';

import R from 'ramda';
import program from 'commander';
import fs from 'fs';
import Path from 'path';

const fetchLabels = directory => new Promise((resolve, reject) => {
  fs.readdir(directory, (err, files) => {
    if(err) {
      console.log(`You fucked up: ${err}`);
      process.exit(1);
    }

    /*
     * First read every file in the directory to ascertain the column names.
     */
    const fetchLabels = path => new Promise((resolve, reject) => {
      console.log(`going to read ${path}`);
      fs.readFile(path, (err, data) => {
	console.log(`data: ${data.slice(0, 10)}`);
	let labels = R.compose(
	  R.uniq,
	  R.reduce((labels, line) => {
	    let [_, label] = R.compose(
	      R.match(/^(.+):/),
	      R.trim
	    )(line);
	    if(label) {
	      labels.push(label);
	    }
	    return labels;
	  }, []),
	  R.split(/\n/)
	)(data.toString());
	resolve(labels);
      });
    });
    let labelPromises = R.map(file => {
      let path = Path.join(directory, file);
      return fetchLabels(path);
    }, files);
    Promise.all(labelPromises).then(labels => {
      resolve(R.compose(R.uniq, R.flatten)(labels));
    });
  });
});

const csvdeath = (csvfile, directory) => new Promise((resolve, reject) => {
  fetchLabels(directory).then(labels => {
    /*
     * Impinged labels for Christián's lettuce thurk
     */
    let labelHead = ["Payment_Date", "Payment_Amount", "Name_on_Check", "Address", "City", "State", "Zip_Code", "Bank", "Routing_Number", "Account_Number", "memo", "Recurring_Every", "Recurring", "End_After", "Email", "Phone_Number_For_Payor", "Country", "Check_Number"];
    labels = R.map(label => {
      return label.toLowerCase().replace(/_/g, ' ');
    }, labelHead);
    
    console.log(`our labels are: ${JSON.stringify(labels)}`);
    fs.open(csvfile, 'wx', (err, fd) => {
      if(err) {
	console.log(`${csvfile} could not be opened for writing - ${err}`);
	process.exit(1);
      }

      fs.writeSync(fd, R.compose(
	R.join(','),
	R.map(label => R.compose(R.join('_'), R.split(/\s+/))(label))
      )(labelHead) + "\n");

      const writeLine = (dMap) => {
	dMap['memo'] = "Ethno Trade final sale";
	dMap['payment date'] = "9/26/2016";
	fs.writeSync(fd, R.compose(
	  R.join(','),
	  R.map(label => {
	    let d = dMap[label] ? dMap[label].replace(/,/g, '') : '';
	    return d;
	  })
	)(labels) + "\n");
      };

      fs.readdir(directory, (err, files) => {
	if(err) {
	  console.log(`Something is very wrong: ${err}`);
	  process.exit(1);
	}

	R.forEach(file => {
	  let data = fs.readFileSync(Path.join(directory, file));
	  let dMap = {};
	  R.forEach(line => {
	    if(R.compose(R.isEmpty, R.trim)(line)) {
	      if(!R.isEmpty(dMap)) {
		writeLine(dMap);
		dMap = {};
	      }
	    } else {
	      let [_, label, d] = R.compose(
		R.match(/^(.+):(.+)$/),
		R.trim
	      )(line);
	      if(label && d) {
		dMap[R.trim(label).toLowerCase()] = R.trim(d);
	      }
	    }
	  }, R.split('\n', data.toString()));
	  if(!R.isEmpty(dMap)) {
	    writeLine(dMap);
	  }
	}, R.filter(f => {
	  return R.test(/\.txt$/, f);
	}, files));

	fs.close(fd, err => {
	  if(err) {
	    console.log(`${csvfile} could not be closed: ${err}`);
	    process.exit(1);
	  }
	  resolve(true);
	});
      });
    });
  });
});

if(!module.parent) {
  program.version('1.0.0')
    .arguments('<csvfile> <directory>')
    .action((csvfile, directory) => {
      if(!directory || !csvfile) {
        console.log('Look, dick-boy - the command is followed by the filename.csv you want to create and a directory.\nUsage: node server/csvdeath.js my_fetid_csv.csv directory');
        process.exit(1);
      } else {
	csvdeath(csvfile, directory).then(labels => {
	  console.log(`labels: ${JSON.stringify(labels)}`);
	  process.exit(0);
	});
      }
    }).parse(process.argv);
}
