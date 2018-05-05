FILES=$(find . -type f)
for f in $FILES
do
	# pbjs $f --js $(basename $f).js
	protoc --js_out=import_style=commonjs,binary:. $f
	#cp $f ./$(basename $f)
done
