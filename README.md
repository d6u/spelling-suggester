# spelling-suggester

A Spelling Suggester example using BK-Tree and Levenshtein edit distance

## Instruction

1. Requires MongoDB to be accessible at `mongodb://localhost:27017/spelling`
2. Requires Mocha task runner to run tests, install with `npm install -g mocha`
3. Run `npm install` to install packages
4. Run `mocha` to run tests in `test` folder
5. Run `node build_tree.js` to build BK-Tree in `bk_tree` collection.
6. Run `mocha -R spec -t 30000 index_integrity_test.js` to test the integrity of BK-Tree. 

	Note: `-t 30000` is important because the test will run about 5s, which will result in a timeout error for Mocha async test.
	
7. Run `node suggest.js` to provide suggestions and save to `suggestions.txt`.

## Attributions

This program is using the following resources:

* BK-Tree [http://en.wikipedia.org/wiki/BK-tree](http://en.wikipedia.org/wiki/BK-tree)
* Levenshtein edit distance [http://en.wikipedia.org/wiki/Levenshtein_distance](http://en.wikipedia.org/wiki/Levenshtein_distance)
* Node async recursive [http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search](http://stackoverflow.com/questions/5827612/node-js-fs-readdir-recursive-directory-search)

## Performance

> Note: searching time is largely depends on CPU, which is 1.86GHz Intel Core 2 Duo in my case.

Average look up time for 2 edit distance is close to 1300ms.

Using BK-Tree approach, to list all potential suggestions, with 2 edit distance, it was able to search only 30% of all words.

If return words with 1 edit distance and maximum 5 words, it searches for average 5% of all words. And average search time is 300ms. 

### 3 Edit Distance

If increase edit distance to 3. The program will have to compare about 60% of all words, which takes about 3000ms provide suggestions for each query.

### 1 Million Records

With 1 million words, 95% of words will be ignored if using 1 edit distance which is about 50 thousand records. If using a faster language such as C++ or C, the performance will be very promising.

### Long query

The differences between long and short queries is very limited, long query will have large overhead when calculating Levenshtein distance, which has a minimum impact on searching speed. With BK-Tree already built, the overall performance will not be effected.

### Notes on Frequency of Suggested Words

In BK-Tree, words with larger frequency will have priority over other words, that is too say, closer to the root of BK-Tree. It ensures more frequent words will be found faster.