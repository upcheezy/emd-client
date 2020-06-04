with county_select as (
	select geom
	from county
	where countyname = 'OCONEE' --county dropdown result goes here
), grid_select as (
	select g.id, g.geom
	from grid g, county_select cs
	where st_intersects(g.geom, cs.geom)
), sa_select as (
	select s.dccode
	from sa_subdivide s
	join grid_select gs on st_intersects (s.geom, gs.geom)
	group by s.dccode
)
select md.*
from member_data md
join sa_select s on md.code = s.dccode
where md.contacttype = 'Member Contact';